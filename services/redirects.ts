import "server-only";
import { dbAvailable, noteDbError, prisma } from "@/lib/db/prisma";

type Rule = { to: string; code: number };
const g = globalThis as unknown as { __redirects?: { map: Map<string, Rule>; loadedAt: number; loading?: Promise<void> } };
const TTL = 60_000;

async function load() {
  if (!dbAvailable()) {
    g.__redirects = { map: g.__redirects?.map ?? new Map(), loadedAt: Date.now() - TTL + 15_000 };
    return;
  }
  try {
    const rows = await prisma.redirect.findMany({ where: { isEnabled: true }, select: { fromPath: true, toPath: true, statusCode: true } });
    g.__redirects = { map: new Map(rows.map((r) => [r.fromPath, { to: r.toPath, code: r.statusCode }])), loadedAt: Date.now() };
  } catch (e) {
    noteDbError(e, "redirects");
    g.__redirects = { map: g.__redirects?.map ?? new Map(), loadedAt: Date.now() };
  }
}

/** In-memory redirect table refreshed every 60s (and immediately after CMS edits via resetRedirectCache). */
export async function findRedirect(path: string): Promise<Rule | undefined> {
  const state = g.__redirects;
  if (!state || Date.now() - state.loadedAt > TTL) {
    if (!state?.loading) {
      const p = load();
      if (g.__redirects) g.__redirects.loading = p;
      await p;
    } else {
      await state.loading;
    }
  }
  return g.__redirects?.map.get(path.length > 1 ? path.replace(/\/$/, "") : path);
}

export function resetRedirectCache() {
  if (g.__redirects) g.__redirects.loadedAt = 0;
}

export async function recordRedirectHit(fromPath: string) {
  await prisma.redirect.update({ where: { fromPath }, data: { hits: { increment: 1 } } }).catch(() => undefined);
}
