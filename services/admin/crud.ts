import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { logActivity } from "@/lib/db/activity";
import { invalidateEntity } from "@/lib/redis/cache";
import { sanitizeRichText } from "@/lib/security/sanitize";
import { readingMinutes, slugify } from "@/lib/utils";
import { announceUrls } from "@/lib/indexnow";
import { ICON_NAMES } from "@/components/ui/icon";
import { can, type CurrentUser, ForbiddenError } from "@/lib/auth/guard";
import type { Field, Resource } from "@/lib/admin/resources";
import { resetRedirectCache } from "@/services/redirects";
import { Prisma } from "@/lib/generated/prisma/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Delegate = {
  findMany(args?: any): Promise<any[]>;
  findFirst(args?: any): Promise<any>;
  count(args?: any): Promise<number>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  updateMany(args: any): Promise<{ count: number }>;
  delete(args: any): Promise<any>;
  deleteMany(args: any): Promise<{ count: number }>;
};
type Tx = Prisma.TransactionClient;
function delegate(model: string, client: Tx | typeof prisma = prisma): Delegate {
  const d = (client as unknown as Record<string, Delegate>)[model];
  if (!d) throw new Error(`Unknown model ${model}`);
  return d;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type ActionResult = { ok: boolean; message?: string; fieldErrors?: Record<string, string[] | undefined>; id?: string };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ─────────────────────────────────────────────────────────────
// Validation built from field config
// ─────────────────────────────────────────────────────────────

function fieldSchema(f: Field): z.ZodType {
  const str = (s: z.ZodString) => (f.required ? s.min(1, `${f.label} is required.`) : s);
  const max = f.max ?? 65_000;
  switch (f.type) {
    case "text":
    case "textarea":
      return str(z.string().trim().max(max, `${f.label} is too long (max ${max}).`));
    case "richtext":
      return str(z.string().max(2_000_000)).transform((v) => sanitizeRichText(v));
    case "slug":
      return z
        .string()
        .trim()
        .toLowerCase()
        .max(180)
        .refine((v) => (f.required ? SLUG_RE.test(v) : v === "" || SLUG_RE.test(v)), "Use lowercase letters, numbers and single dashes.");
    case "url":
      return z
        .string()
        .trim()
        .max(512)
        .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Must be a full http(s):// URL.")
        .transform((v) => v || null);
    case "email":
      return z.string().trim().toLowerCase().max(191).refine((v) => v === "" || z.email().safeParse(v).success, "Invalid email.").transform((v) => v || null);
    case "number":
      return z
        .string()
        .trim()
        .transform((v, ctx) => {
          if (v === "") return f.name === "sortOrder" ? 0 : null;
          const n = Number(v);
          if (!Number.isInteger(n)) ctx.addIssue({ code: "custom", message: `${f.label} must be a whole number.` });
          if (f.min !== undefined && n < f.min) ctx.addIssue({ code: "custom", message: `${f.label} must be ≥ ${f.min}.` });
          if (f.max !== undefined && n > f.max) ctx.addIssue({ code: "custom", message: `${f.label} must be ≤ ${f.max}.` });
          return n;
        });
    case "boolean":
      return z.string().optional().transform((v) => v === "on" || v === "true");
    case "select":
    case "status": {
      const values = (f.options ?? []).map((o) => o.value);
      return z.string().refine((v) => (!f.required && v === "") || values.includes(v), `Choose a valid ${f.label.toLowerCase()}.`).transform((v) => v || null);
    }
    case "datetime":
      return z
        .string()
        .trim()
        .transform((v, ctx) => {
          if (!v) return null;
          const d = new Date(v);
          if (Number.isNaN(d.getTime())) ctx.addIssue({ code: "custom", message: "Invalid date." });
          return d;
        });
    case "icon":
      return z.string().refine((v) => v === "" || ICON_NAMES.includes(v), "Unknown icon.").transform((v) => v || null);
    case "relation":
    case "media":
      return z.string().max(191).transform((v) => v || null);
    case "list":
      return z
        .string()
        .max(20_000)
        .transform((v) => v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 100));
    case "items":
      return z
        .string()
        .max(50_000)
        .transform((v) =>
          v
            .split(/\r?\n/)
            .map((line) => {
              const [title, ...rest] = line.split("|");
              return { title: (title ?? "").trim(), description: rest.join("|").trim() };
            })
            .filter((x) => x.title)
            .slice(0, 50),
        );
    case "tags":
      return z
        .string()
        .max(2000)
        .transform((v) => [...new Set(v.split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 20));
    case "relationMany":
    case "gallery":
      return z.array(z.string().max(191)).max(100);
  }
}

function readForm(resource: Resource, form: FormData) {
  const raw: Record<string, unknown> = {};
  for (const f of resource.fields) {
    if (f.type === "relationMany" || f.type === "gallery") raw[f.name] = form.getAll(f.name).map(String).filter(Boolean);
    else if (f.type === "boolean") raw[f.name] = form.get(f.name) ?? undefined;
    else raw[f.name] = String(form.get(f.name) ?? "");
  }
  const shape = Object.fromEntries(resource.fields.map((f) => [f.name, fieldSchema(f)]));
  return z.object(shape).safeParse(raw);
}

// ─────────────────────────────────────────────────────────────
// Per-resource business rules
// ─────────────────────────────────────────────────────────────

type Data = Record<string, unknown>;
type Ctx = { user: CurrentUser; resource: Resource; existing: Data | null; tx: Tx };

const SPECIAL_FIELDS = new Set(["tags", "services", "gallery"]);

async function applyRules(data: Data, ctx: Ctx): Promise<Record<string, string[]> | null> {
  const { resource, user, existing } = ctx;
  const errors: Record<string, string[]> = {};

  if (resource.hasStatus) {
    const next = data.status as string | undefined;
    const prev = existing?.status as string | undefined;
    const goingLive = (next === "PUBLISHED" || next === "SCHEDULED") && next !== prev;
    if (goingLive && resource.publishPermission && !can(user, resource.publishPermission)) {
      errors.status = ["You don't have permission to publish. Save as draft and ask an editor to publish."];
    }
    if (next === "PUBLISHED" && ["services", "solutions", "projects"].includes(resource.key) && !existing?.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  switch (resource.key) {
    case "blog-posts": {
      const content = String(data.content ?? "");
      data.readingMinutes = readingMinutes(content);
      if (!existing) data.authorId = user.id;
      if (data.status === "SCHEDULED") {
        const when = data.scheduledFor as Date | null;
        if (!when) errors.scheduledFor = ["Choose when this post should go live."];
        else if (when.getTime() < Date.now() - 60_000) errors.scheduledFor = ["Scheduled time must be in the future."];
        else data.publishedAt = when;
      } else if (data.status === "PUBLISHED") {
        data.publishedAt = existing?.publishedAt ?? new Date();
        data.scheduledFor = null;
      }
      break;
    }
    case "faqs": {
      if (data.scope === "general") Object.assign(data, { serviceId: null, solutionId: null });
      if (data.scope === "service") {
        data.solutionId = null;
        if (!data.serviceId) errors.serviceId = ["Choose the service this FAQ belongs to."];
      }
      if (data.scope === "solution") {
        data.serviceId = null;
        if (!data.solutionId) errors.solutionId = ["Choose the solution this FAQ belongs to."];
      }
      break;
    }
    case "seo": {
      const p = String(data.path ?? "");
      if (!p.startsWith("/") || p.startsWith("//") || /\s/.test(p)) errors.path = ["Path must start with / and contain no spaces."];
      else data.path = p.length > 1 ? p.replace(/\/$/, "") : p;
      break;
    }
    case "redirects": {
      const from = String(data.fromPath ?? "");
      const to = String(data.toPath ?? "");
      if (!from.startsWith("/") || from.startsWith("//") || from.startsWith("/admin") || from.startsWith("/api")) {
        errors.fromPath = ["Must be a site path starting with / (not /admin or /api)."];
      }
      if (!(to.startsWith("/") && !to.startsWith("//")) && !/^https?:\/\//i.test(to)) errors.toPath = ["Must be a /path or a full https:// URL."];
      if (from === to) errors.toPath = ["Redirect target cannot equal the source."];
      data.fromPath = from.length > 1 ? from.replace(/\/$/, "") : from;
      data.statusCode = Number(data.statusCode ?? 301);
      break;
    }
    case "pages": {
      if (existing?.isSystem) {
        data.key = existing.key;
        if (existing.key === "home" || existing.key === "about" || existing.key === "contact") data.slug = existing.slug;
      }
      if (["admin", "api", "services", "solutions", "industries", "portfolio", "team", "blog", "newsletter"].includes(String(data.slug))) {
        errors.slug = ["This slug is reserved by the site."];
      }
      break;
    }
    case "navigation-items": {
      if (existing && data.parentId === existing.id) errors.parentId = ["An item cannot be its own parent."];
      break;
    }
  }
  return Object.keys(errors).length ? errors : null;
}

async function syncRelations(id: string, special: Data, ctx: Ctx) {
  const { tx, resource } = ctx;
  if (resource.key === "blog-posts" && Array.isArray(special.tags)) {
    const tagIds: string[] = [];
    for (const name of special.tags as string[]) {
      const slug = slugify(name);
      if (!slug) continue;
      const tag = await tx.blogTag.upsert({ where: { slug }, update: {}, create: { slug, name: name.slice(0, 120) } });
      tagIds.push(tag.id);
    }
    await tx.blogPostTag.deleteMany({ where: { postId: id } });
    if (tagIds.length) await tx.blogPostTag.createMany({ data: tagIds.map((tagId) => ({ postId: id, tagId })), skipDuplicates: true });
  }
  if (resource.key === "projects") {
    if (Array.isArray(special.services)) {
      await tx.projectService.deleteMany({ where: { projectId: id } });
      const ids = special.services as string[];
      if (ids.length) await tx.projectService.createMany({ data: ids.map((serviceId) => ({ projectId: id, serviceId })), skipDuplicates: true });
    }
    if (Array.isArray(special.gallery)) {
      await tx.projectImage.deleteMany({ where: { projectId: id } });
      const ids = special.gallery as string[];
      if (ids.length) await tx.projectImage.createMany({ data: ids.map((mediaId, sortOrder) => ({ projectId: id, mediaId, sortOrder })) });
    }
  }
}

async function afterChange(resource: Resource, user: CurrentUser, action: string, id: string | null, summary: string) {
  await logActivity({ userId: user.id, action, entityType: resource.key, entityId: id, summary });
  await invalidateEntity(resource.cacheEntity);
  if (resource.key === "redirects") resetRedirectCache();
  revalidatePath("/", "layout");
}

function prismaFieldErrors(e: unknown, resource: Resource): ActionResult | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      const target = String((e.meta as { target?: unknown } | undefined)?.target ?? "");
      const field = resource.fields.find((f) => target.includes(f.name))?.name ?? "slug";
      return { ok: false, message: "That value is already in use.", fieldErrors: { [field]: ["Already in use — choose another."] } };
    }
    if (e.code === "P2003") return { ok: false, message: "This item is referenced elsewhere or points to a missing record." };
    if (e.code === "P2025") return { ok: false, message: "This item no longer exists." };
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Public API used by server actions
// ─────────────────────────────────────────────────────────────

export function assertResourceAccess(user: CurrentUser, resource: Resource) {
  if (!can(user, resource.permission)) throw new ForbiddenError();
}

export async function listRecords(
  resource: Resource,
  opts: { q?: string; page?: number; perPage?: number; sort?: string; dir?: string; filters?: Record<string, string> },
) {
  const perPage = Math.min(100, Math.max(5, opts.perPage ?? 20));
  const page = Math.max(1, opts.page ?? 1);
  const sortable = new Set(resource.columns.filter((c) => c.sortable).map((c) => c.name));
  const sortField = opts.sort && sortable.has(opts.sort) ? opts.sort : resource.defaultSort.field;
  const dir = opts.dir === "asc" || opts.dir === "desc" ? opts.dir : resource.defaultSort.dir;
  const where: Record<string, unknown> = {};
  if (resource.softDelete) where.deletedAt = null;
  const q = opts.q?.trim().slice(0, 100);
  if (q) where.OR = resource.searchFields.map((f) => ({ [f]: { contains: q } }));
  const allowedFilters = new Set([...(resource.filters ?? []).map((f) => f.name), ...resource.fields.filter((f) => f.type === "relation").map((f) => f.name)]);
  for (const [k, v] of Object.entries(opts.filters ?? {})) if (v && allowedFilters.has(k)) where[k] = v;
  const d = delegate(resource.model);
  const [rows, total] = await Promise.all([
    d.findMany({ where, orderBy: [{ [sortField]: dir }, { id: "asc" }], skip: (page - 1) * perPage, take: perPage, include: resource.include }),
    d.count({ where }),
  ]);
  return { rows: rows as Record<string, unknown>[], total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)), sort: sortField, dir };
}

export async function getRecord(resource: Resource, id: string) {
  const include: Record<string, unknown> = { ...(resource.include ?? {}) };
  if (resource.key === "blog-posts") include.tags = { include: { tag: true } };
  if (resource.key === "projects") Object.assign(include, { services: true, images: { orderBy: { sortOrder: "asc" } } });
  const where: Record<string, unknown> = { id };
  if (resource.softDelete) where.deletedAt = null;
  return (await delegate(resource.model).findFirst({ where, include: Object.keys(include).length ? include : undefined })) as Record<string, unknown> | null;
}

export async function saveRecord(resource: Resource, user: CurrentUser, form: FormData, id?: string): Promise<ActionResult> {
  assertResourceAccess(user, resource);
  const parsed = readForm(resource, form);
  if (!parsed.success) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const all = parsed.data as Data;
  const data: Data = {};
  const special: Data = {};
  for (const [k, v] of Object.entries(all)) (SPECIAL_FIELDS.has(k) ? special : data)[k] = v;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const d = delegate(resource.model, tx);
      const existing = id ? ((await d.findFirst({ where: resource.softDelete ? { id, deletedAt: null } : { id } })) as Data | null) : null;
      if (id && !existing) return { ok: false, message: "This item no longer exists." } satisfies ActionResult;
      const errors = await applyRules(data, { user, resource, existing, tx });
      if (errors) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: errors } satisfies ActionResult;
      const saved = id ? await d.update({ where: { id }, data }) : await d.create({ data });
      await syncRelations(saved.id as string, special, { user, resource, existing, tx });
      return { ok: true, id: saved.id as string, message: id ? "Saved." : "Created." } satisfies ActionResult;
    });
    if (result.ok) {
      await afterChange(resource, user, id ? "update" : "create", result.id ?? null, `${id ? "Updated" : "Created"} ${resource.singular.toLowerCase()} “${String(all[resource.titleField] ?? "")}”`);
      // Tell search engines about the new or updated public page (no-op unless IndexNow is configured).
      if (resource.publicPath && typeof all.slug === "string" && (!resource.hasStatus || all.status === "PUBLISHED")) {
        void announceUrls([resource.publicPath.replace("{slug}", all.slug)]);
      }
    }
    return result;
  } catch (e) {
    const friendly = prismaFieldErrors(e, resource);
    if (friendly) return friendly;
    console.error(`[admin] save ${resource.key} failed`, e);
    return { ok: false, message: "Could not save. Please try again." };
  }
}

export async function deleteRecords(resource: Resource, user: CurrentUser, ids: string[]): Promise<ActionResult> {
  assertResourceAccess(user, resource);
  if (!ids.length) return { ok: false, message: "Nothing selected." };
  const d = delegate(resource.model);
  try {
    if (resource.key === "pages") {
      const system = await prisma.page.count({ where: { id: { in: ids }, isSystem: true } });
      if (system) return { ok: false, message: "System pages (home, about, contact, privacy, terms) cannot be deleted. Unpublish them instead." };
    }
    if (resource.softDelete) {
      // Free the unique slug so it can be reused, then soft-delete.
      const stamp = Date.now().toString(36);
      await prisma.$transaction(async (tx) => {
        const td = delegate(resource.model, tx);
        const rows = (await td.findMany({ where: { id: { in: ids }, deletedAt: null }, select: { id: true, slug: true } })) as { id: string; slug: string }[];
        for (const r of rows) {
          await td.update({ where: { id: r.id }, data: { deletedAt: new Date(), status: "ARCHIVED", slug: `${r.slug}-deleted-${stamp}`.slice(0, 191) } });
        }
      });
    } else {
      await d.deleteMany({ where: { id: { in: ids } } });
    }
    await afterChange(resource, user, "delete", ids.length === 1 ? ids[0]! : null, `Deleted ${ids.length} ${resource.label.toLowerCase()}`);
    return { ok: true, message: `Deleted ${ids.length} item${ids.length > 1 ? "s" : ""}.` };
  } catch (e) {
    const friendly = prismaFieldErrors(e, resource);
    if (friendly) return friendly;
    console.error(`[admin] delete ${resource.key} failed`, e);
    return { ok: false, message: "Could not delete. The item may be in use." };
  }
}

export async function setStatus(resource: Resource, user: CurrentUser, ids: string[], status: "PUBLISHED" | "DRAFT" | "ARCHIVED"): Promise<ActionResult> {
  assertResourceAccess(user, resource);
  if (!resource.hasStatus) return { ok: false, message: "This module has no publishing status." };
  if (status === "PUBLISHED" && resource.publishPermission && !can(user, resource.publishPermission)) {
    throw new ForbiddenError("You don't have permission to publish.");
  }
  const where: Record<string, unknown> = { id: { in: ids } };
  if (resource.softDelete) where.deletedAt = null;
  const hasPublishedAt = ["services", "solutions", "projects", "blog-posts"].includes(resource.key);
  await prisma.$transaction(async (tx) => {
    const td = delegate(resource.model, tx);
    await td.updateMany({ where, data: { status } });
    if (status === "PUBLISHED" && hasPublishedAt) {
      await td.updateMany({ where: { ...where, publishedAt: null }, data: { publishedAt: new Date() } });
    }
  });
  await afterChange(resource, user, status === "PUBLISHED" ? "publish" : status === "DRAFT" ? "unpublish" : "archive", ids.length === 1 ? ids[0]! : null, `${status.toLowerCase()} ${ids.length} ${resource.label.toLowerCase()}`);
  return { ok: true, message: `${ids.length} item${ids.length > 1 ? "s" : ""} ${status === "PUBLISHED" ? "published" : status === "DRAFT" ? "moved to draft" : "archived"}.` };
}

/** Options for relation selects in forms & filters. */
export async function relationOptions(resource: Resource) {
  const out: Record<string, { value: string; label: string }[]> = {};
  for (const f of resource.fields) {
    if ((f.type === "relation" || f.type === "relationMany") && f.relation) {
      const rows = (await delegate(f.relation.model).findMany({
        where: f.relation.where,
        select: { id: true, [f.relation.labelField]: true },
        orderBy: { [f.relation.labelField]: "asc" },
        take: 500,
      })) as Record<string, string>[];
      out[f.name] = rows.map((r) => ({ value: r.id!, label: r[f.relation!.labelField] ?? r.id! }));
    }
  }
  return out;
}
