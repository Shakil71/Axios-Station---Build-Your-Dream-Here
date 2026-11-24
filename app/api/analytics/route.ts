import { NextResponse } from "next/server";
import { z } from "zod";
import { dbAvailable, noteDbError, prisma } from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { getSettings } from "@/services/public";
import { bool } from "@/lib/settings-schema";

const schema = z.object({
  type: z.enum(["page_view", "cta_click"]),
  path: z.string().startsWith("/").max(255),
  referrer: z.string().max(500).optional(),
});

/** Anonymous, cookieless first-party page-view counter (only when enabled in Analytics Settings). */
export async function POST(req: Request) {
  if (!(await assertSameOrigin(req))) return new NextResponse(null, { status: 403 });
  const settings = await getSettings();
  if (!bool(settings, "analytics.internalPageViews")) return new NextResponse(null, { status: 204 });
  const ip = await getClientIp();
  const rl = await rateLimit("analytics", ip, 120, 60);
  if (!rl.allowed) return new NextResponse(null, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || parsed.data.path.startsWith("/admin")) return new NextResponse(null, { status: 204 });
  let referrer = parsed.data.referrer || null;
  try {
    referrer = referrer ? new URL(referrer).origin : null; // keep only the origin — no query strings
  } catch {
    referrer = null;
  }
  // Analytics is best-effort: never wait on (or spam logs about) an unavailable database.
  if (dbAvailable()) {
    await prisma.analyticsEvent
      .create({ data: { type: parsed.data.type, path: parsed.data.path, referrer } })
      .catch((e) => noteDbError(e, "analytics"));
  }
  return new NextResponse(null, { status: 204 });
}
