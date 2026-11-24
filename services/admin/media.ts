import "server-only";
import sharp from "sharp";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { getStorage, getStorageByName } from "@/lib/storage";
import { buildStorageKey, detectFileType, sanitizeFilename } from "@/lib/security/upload";
import { logActivity } from "@/lib/db/activity";
import { invalidateEntity } from "@/lib/redis/cache";
import type { CurrentUser } from "@/lib/auth/guard";

export class UploadError extends Error {}

const MAX_DIMENSION = 2400;

/**
 * Validate and store an upload.
 *  – size limit enforced before reading into image pipeline
 *  – real type detected from magic bytes (client MIME ignored)
 *  – images re-encoded with sharp: strips EXIF/GPS metadata, auto-rotates, caps
 *    dimensions, converts to WebP (GIF kept as-is to preserve animation)
 */
export async function storeUpload(file: File, user: CurrentUser, meta: { altText?: string } = {}) {
  if (!(file instanceof File) || file.size === 0) throw new UploadError("No file received.");
  if (file.size > env.UPLOAD_MAX_BYTES) throw new UploadError(`File is too large (max ${Math.round(env.UPLOAD_MAX_BYTES / 1024 / 1024)} MB).`);

  const input = Buffer.from(await file.arrayBuffer());
  const type = detectFileType(input, file.name);
  if (!type) throw new UploadError("Unsupported file type. Allowed: JPG, PNG, WebP, AVIF, GIF, PDF, DOCX, XLSX, PPTX.");

  let body = input;
  let mime = type.mime;
  let ext = type.ext;
  let width: number | null = null;
  let height: number | null = null;

  if (type.kind === "IMAGE") {
    try {
      if (type.mime === "image/gif") {
        const m = await sharp(input, { animated: true }).metadata();
        width = m.width ?? null;
        height = m.pageHeight ?? m.height ?? null;
      } else {
        const out = await sharp(input, { limitInputPixels: 40_000_000 })
          .rotate()
          .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true });
        body = out.data;
        width = out.info.width;
        height = out.info.height;
        mime = "image/webp";
        ext = "webp";
      }
    } catch {
      throw new UploadError("The image could not be processed. It may be corrupted.");
    }
  }

  const storage = getStorage();
  const key = buildStorageKey(file.name, ext);
  const { url } = await storage.put(key, body, mime);
  const originalName = sanitizeFilename(file.name);

  const media = await prisma.media.create({
    data: {
      kind: type.kind,
      storage: storage.name,
      storageKey: key,
      url,
      originalName,
      mimeType: mime,
      sizeBytes: body.length,
      width,
      height,
      altText: meta.altText?.slice(0, 255) || null,
      title: originalName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 255),
      uploadedById: user.id,
    },
  });
  await logActivity({ userId: user.id, action: "upload", entityType: "media", entityId: media.id, summary: `Uploaded ${originalName}` });
  return media;
}

/** Where a media item is used. Deletion is blocked while any reference exists. */
export async function mediaReferences(id: string) {
  const [services, solutions, industries, projects, gallery, team, posts, testimonials, sections] = await Promise.all([
    prisma.service.findMany({ where: { coverImageId: id }, select: { id: true, title: true } }),
    prisma.solution.findMany({ where: { coverImageId: id }, select: { id: true, title: true } }),
    prisma.industry.findMany({ where: { coverImageId: id }, select: { id: true, title: true } }),
    prisma.project.findMany({ where: { coverImageId: id }, select: { id: true, title: true } }),
    prisma.projectImage.findMany({ where: { mediaId: id }, select: { project: { select: { id: true, title: true } } } }),
    prisma.teamMember.findMany({ where: { photoId: id }, select: { id: true, name: true } }),
    prisma.blogPost.findMany({ where: { coverImageId: id }, select: { id: true, title: true } }),
    prisma.testimonial.findMany({ where: { avatarId: id }, select: { id: true, authorName: true } }),
    prisma.pageSection.findMany({ where: { imageId: id }, select: { id: true, type: true, page: { select: { title: true } } } }),
  ]);
  return [
    ...services.map((r) => ({ type: "Service", label: r.title, href: `/admin/content/services/${r.id}` })),
    ...solutions.map((r) => ({ type: "Solution", label: r.title, href: `/admin/content/solutions/${r.id}` })),
    ...industries.map((r) => ({ type: "Industry", label: r.title, href: `/admin/content/industries/${r.id}` })),
    ...projects.map((r) => ({ type: "Project cover", label: r.title, href: `/admin/content/projects/${r.id}` })),
    ...gallery.map((r) => ({ type: "Project gallery", label: r.project.title, href: `/admin/content/projects/${r.project.id}` })),
    ...team.map((r) => ({ type: "Team member", label: r.name, href: `/admin/content/team/${r.id}` })),
    ...posts.map((r) => ({ type: "Blog post", label: r.title, href: `/admin/content/blog-posts/${r.id}` })),
    ...testimonials.map((r) => ({ type: "Testimonial", label: r.authorName, href: `/admin/content/testimonials/${r.id}` })),
    ...sections.map((r) => ({ type: "Page section", label: `${r.page.title} › ${r.type}`, href: `/admin/homepage` })),
  ];
}

export async function deleteMedia(id: string, user: CurrentUser): Promise<{ ok: boolean; message: string }> {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return { ok: false, message: "Media not found." };
  const refs = await mediaReferences(id);
  if (refs.length) {
    return { ok: false, message: `This file is used in ${refs.length} place${refs.length > 1 ? "s" : ""}. Remove it from that content first.` };
  }
  await prisma.media.delete({ where: { id } });
  if (media.storage !== "static") {
    try {
      await getStorageByName(media.storage).remove(media.storageKey);
    } catch (e) {
      console.error("[media] file removal failed (record already deleted)", e);
    }
  }
  await logActivity({ userId: user.id, action: "delete", entityType: "media", entityId: id, summary: `Deleted ${media.originalName}` });
  await invalidateEntity("media");
  return { ok: true, message: "File deleted." };
}
