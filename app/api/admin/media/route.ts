import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { can, getCurrentUser } from "@/lib/auth/guard";
import type { Permission } from "@/lib/auth/permissions";
import { assertSameOrigin, getClientIp } from "@/lib/security/request";
import { rateLimit, limits } from "@/lib/security/rate-limit";
import { storeUpload, UploadError } from "@/services/admin/media";

export const dynamic = "force-dynamic";

/** Anyone who edits content with images may browse/pick and upload media. */
const MEDIA_USERS: Permission[] = [
  "media.manage", "services.manage", "solutions.manage", "industries.manage", "portfolio.manage", "team.manage",
  "blog.manage", "testimonials.manage", "homepage.manage", "pages.manage",
];

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!can(user, MEDIA_USERS)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const kind = url.searchParams.get("kind");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const perPage = 30;
  const where = {
    ...(q ? { OR: [{ originalName: { contains: q } }, { altText: { contains: q } }, { title: { contains: q } }] } : {}),
    ...(kind === "IMAGE" || kind === "DOCUMENT" ? { kind: kind as "IMAGE" | "DOCUMENT" } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: { id: true, url: true, kind: true, originalName: true, altText: true, width: true, height: true, mimeType: true, sizeBytes: true },
    }),
    prisma.media.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pages: Math.max(1, Math.ceil(total / perPage)) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  if (!(await assertSameOrigin(req))) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const user = await getCurrentUser();
  if (!can(user, MEDIA_USERS) || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = await rateLimit("upload", `${user.id}:${await getClientIp()}`, limits.upload.limit, limits.upload.windowSec);
  if (!rl.allowed) return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  try {
    const media = await storeUpload(file, user, { altText: String(form?.get("altText") ?? "") });
    return NextResponse.json({ id: media.id, url: media.url, kind: media.kind, originalName: media.originalName, altText: media.altText, width: media.width, height: media.height }, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[upload]", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
