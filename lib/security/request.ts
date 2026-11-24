import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/** Client IP as forwarded by Nginx (X-Real-IP / X-Forwarded-For). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return "unknown";
}

export async function getUserAgent(): Promise<string> {
  return ((await headers()).get("user-agent") ?? "").slice(0, 255);
}

/** One-way hash of an IP so we can spot abuse without storing raw IPs with leads. */
export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${process.env.AUTH_SECRET ?? "axs"}:${ip}`)
    .digest("hex");
}

/**
 * Same-origin check for Route Handlers that accept form/JSON POSTs.
 * (Server Actions already enforce Origin checks inside Next.js.)
 */
export async function assertSameOrigin(req: Request): Promise<boolean> {
  const origin = req.headers.get("origin");
  if (!origin) return req.method === "GET";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
