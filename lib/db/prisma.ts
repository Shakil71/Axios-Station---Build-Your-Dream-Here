import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { env, isProd } from "@/lib/env";

function connectionConfig() {
  const url = new URL(env.DATABASE_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    allowPublicKeyRetrieval: true,
  };
}

function create() {
  const url = new URL(env.DATABASE_URL);
  const adapter = new PrismaMariaDb({
    ...connectionConfig(),
    connectionLimit: Number(url.searchParams.get("connection_limit") ?? 10),
    connectTimeout: 5000,
    acquireTimeout: 8000,
  });
  // Query errors are logged by our own handlers (safeQuery / actions), with the real cause.
  return new PrismaClient({ adapter, log: isProd ? [] : ["warn"] });
}

type G = { __prisma?: PrismaClient; __dbDownUntil?: number; __dbLastReport?: number };
const g = globalThis as unknown as G;
export const prisma = g.__prisma ?? create();
g.__prisma = prisma;

const DOWN_MS = 15_000;
const CONNECTION_ERR = /pool failed|connect|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Access denied|P1000|P1001|45028/i;

/** False while the database recently failed — callers can skip non-essential work (e.g. analytics). */
export function dbAvailable(): boolean {
  return !g.__dbDownUntil || Date.now() >= g.__dbDownUntil;
}

/**
 * Prisma's driver adapter reports every connection problem as "pool failed to
 * retrieve a connection". Probe once with the raw driver and log the real cause
 * (wrong password, DB missing, server down…) — at most once a minute.
 */
async function reportConnectionProblem() {
  if (g.__dbLastReport && Date.now() - g.__dbLastReport < 60_000) return;
  g.__dbLastReport = Date.now();
  let cause = "unknown";
  try {
    const mariadb = await import("mariadb");
    const conn = await mariadb.createConnection({ ...connectionConfig(), connectTimeout: 3000 });
    await conn.end();
    cause = "a direct connection works — the pool may be exhausted or MySQL is overloaded";
  } catch (e) {
    const err = e as { code?: string; sqlMessage?: string; message?: string };
    cause = `${err.code ?? ""} ${err.sqlMessage ?? err.message ?? String(e)}`.trim();
  }
  console.error(`[db] MySQL unavailable: ${cause}. Check DATABASE_URL in .env. Database calls are skipped for ${DOWN_MS / 1000}s.`);
}

/** Record a failed query; trips the short circuit-breaker on connection errors. */
export function noteDbError(err: unknown, label = "query"): void {
  const msg = err instanceof Error ? err.message : String(err);
  if (CONNECTION_ERR.test(msg)) {
    g.__dbDownUntil = Date.now() + DOWN_MS;
    void reportConnectionProblem();
  } else {
    console.error(`[db] ${label} failed:`, msg.split("\n").filter(Boolean).slice(-1)[0]);
  }
}

/**
 * Run a read query for public pages. If the database is unreachable the page
 * still renders (with an empty state) instead of crashing, and further queries
 * short-circuit for a few seconds so a dead DB doesn't stall every request.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T, label = "query"): Promise<T> {
  if (!dbAvailable()) return fallback;
  try {
    return await fn();
  } catch (err) {
    noteDbError(err, label);
    return fallback;
  }
}
