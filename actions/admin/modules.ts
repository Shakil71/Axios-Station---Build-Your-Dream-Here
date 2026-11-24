"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/db/activity";
import { invalidateAll, invalidateEntity } from "@/lib/redis/cache";
import { deleteMedia } from "@/services/admin/media";
import { SETTINGS, SETTING_GROUPS, type SettingGroup } from "@/lib/settings-schema";
import { hashPassword, passwordPolicyError } from "@/lib/security/password";
import { isPermission } from "@/lib/auth/permissions";
import type { Prisma } from "@/lib/generated/prisma/client";
import { guarded, type Result } from "./guarded";

const id = z.string().min(1).max(191);
const refreshSite = () => revalidatePath("/", "layout");

// ── Newsletter ──────────────────────────────────────────────

export async function subscriberAction(subscriberId: string, op: "unsubscribe" | "resubscribe" | "delete"): Promise<Result> {
  return guarded(async () => {
    const user = await requirePermission("newsletter.manage");
    const sid = id.parse(subscriberId);
    if (op === "delete") await prisma.newsletterSubscriber.delete({ where: { id: sid } });
    else
      await prisma.newsletterSubscriber.update({
        where: { id: sid },
        data: op === "unsubscribe" ? { status: "UNSUBSCRIBED", unsubscribedAt: new Date() } : { status: "SUBSCRIBED", unsubscribedAt: null },
      });
    await logActivity({ userId: user.id, action: op, entityType: "newsletter", entityId: sid });
    revalidatePath("/admin/newsletter");
    return { ok: true, message: op === "delete" ? "Subscriber deleted." : `Subscriber ${op}d.` };
  });
}

// ── Media ───────────────────────────────────────────────────

export async function updateMediaAction(mediaId: string, _prev: Result, form: FormData): Promise<Result> {
  return guarded(async () => {
    const user = await requirePermission("media.manage");
    const parsed = z
      .object({ altText: z.string().trim().max(255), title: z.string().trim().max(255), caption: z.string().trim().max(2000) })
      .safeParse({ altText: form.get("altText") ?? "", title: form.get("title") ?? "", caption: form.get("caption") ?? "" });
    if (!parsed.success) return { ok: false, message: "Invalid values." };
    await prisma.media.update({
      where: { id: id.parse(mediaId) },
      data: { altText: parsed.data.altText || null, title: parsed.data.title || null, caption: parsed.data.caption || null },
    });
    await logActivity({ userId: user.id, action: "update", entityType: "media", entityId: mediaId, summary: "Updated media details" });
    await invalidateEntity("media");
    revalidatePath("/admin/media");
    refreshSite();
    return { ok: true, message: "Media details saved." };
  });
}

export async function deleteMediaAction(mediaId: string): Promise<Result> {
  return guarded(async () => {
    const user = await requirePermission("media.manage");
    const r = await deleteMedia(id.parse(mediaId), user);
    if (r.ok) revalidatePath("/admin/media");
    return r;
  });
}

// ── Homepage builder / page sections ────────────────────────

const sectionSchema = z.object({
  title: z.string().trim().max(255),
  subtitle: z.string().trim().max(255),
  description: z.string().trim().max(5000),
  ctaLabel: z.string().trim().max(120),
  ctaHref: z.string().trim().max(255),
  cta2Label: z.string().trim().max(120),
  cta2Href: z.string().trim().max(255),
  imageId: z.string().max(191),
  items: z.string().max(20_000),
  list: z.string().max(10_000),
  stats: z.string().max(5_000),
  limit: z.string().max(3),
});

const hrefOk = (h: string) => h === "" || (h.startsWith("/") && !h.startsWith("//")) || /^https?:\/\//i.test(h) || h.startsWith("#");

export async function saveSectionAction(sectionId: string, _prev: Result, form: FormData): Promise<Result> {
  return guarded(async () => {
    const user = await requirePermission(["homepage.manage", "pages.manage"]);
    const raw = Object.fromEntries(Object.keys(sectionSchema.shape).map((k) => [k, String(form.get(k) ?? "")]));
    const parsed = sectionSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Some values are too long." };
    const d = parsed.data;
    if (!hrefOk(d.ctaHref) || !hrefOk(d.cta2Href)) return { ok: false, message: "Button links must be /paths or full https:// URLs." };
    const items = d.items.split(/\r?\n/).map((l) => {
      const [t, ...rest] = l.split("|");
      return { title: (t ?? "").trim(), description: rest.join("|").trim() };
    }).filter((x) => x.title);
    const stats = d.stats.split(/\r?\n/).map((l) => {
      const [value, ...rest] = l.split("|");
      return { value: (value ?? "").trim(), label: rest.join("|").trim() };
    }).filter((x) => x.value && x.label);
    const list = d.list.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const limit = Math.min(24, Math.max(1, Number(d.limit) || 6));
    const section = await prisma.pageSection.findUnique({ where: { id: id.parse(sectionId) } });
    if (!section) return { ok: false, message: "Section not found." };
    await prisma.pageSection.update({
      where: { id: section.id },
      data: {
        title: d.title || null,
        subtitle: d.subtitle || null,
        description: d.description || null,
        ctaLabel: d.ctaLabel || null,
        ctaHref: d.ctaHref || null,
        cta2Label: d.cta2Label || null,
        cta2Href: d.cta2Href || null,
        imageId: d.imageId || null,
        data: { items, list, stats, limit } as Prisma.InputJsonValue,
      },
    });
    await logActivity({ userId: user.id, action: "update", entityType: "page_section", entityId: section.id, summary: `Updated ${section.type} section` });
    await invalidateEntity("page");
    refreshSite();
    return { ok: true, message: "Section saved." };
  });
}

export async function sectionOpAction(sectionId: string, op: "toggle" | "up" | "down" | "delete"): Promise<Result> {
  return guarded(async () => {
    const user = await requirePermission(["homepage.manage", "pages.manage"]);
    const section = await prisma.pageSection.findUnique({ where: { id: id.parse(sectionId) } });
    if (!section) return { ok: false, message: "Section not found." };
    if (op === "toggle") {
      await prisma.pageSection.update({ where: { id: section.id }, data: { isEnabled: !section.isEnabled } });
    } else if (op === "delete") {
      await prisma.pageSection.delete({ where: { id: section.id } });
    } else {
      // Normalise order then swap with neighbour inside a transaction.
      await prisma.$transaction(async (tx) => {
        const all = await tx.pageSection.findMany({ where: { pageId: section.pageId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
        const idx = all.findIndex((s) => s.id === section.id);
        const j = op === "up" ? idx - 1 : idx + 1;
        if (j < 0 || j >= all.length) return;
        [all[idx], all[j]] = [all[j]!, all[idx]!];
        for (const [i, s] of all.entries()) await tx.pageSection.update({ where: { id: s.id }, data: { sortOrder: i } });
      });
    }
    await logActivity({ userId: user.id, action: op, entityType: "page_section", entityId: section.id, summary: `${op} ${section.type} section` });
    await invalidateEntity("page");
    refreshSite();
    revalidatePath("/admin/homepage");
    return { ok: true, message: op === "toggle" ? (section.isEnabled ? "Section hidden." : "Section enabled.") : op === "delete" ? "Section removed." : "Order updated." };
  });
}

export async function addSectionAction(pageKey: string, type: string): Promise<Result> {
  return guarded(async () => {
    const user = await requirePermission(["homepage.manage", "pages.manage"]);
    const t = z.string().regex(/^[a-z_]{2,40}$/).parse(type);
    const page = await prisma.page.findUnique({ where: { key: z.string().max(64).parse(pageKey) } });
    if (!page) return { ok: false, message: "Page not found." };
    const max = await prisma.pageSection.aggregate({ where: { pageId: page.id }, _max: { sortOrder: true } });
    const s = await prisma.pageSection.create({
      data: { pageId: page.id, type: t, title: `New ${t} section`, sortOrder: (max._max.sortOrder ?? 0) + 1, isEnabled: false },
    });
    await logActivity({ userId: user.id, action: "create", entityType: "page_section", entityId: s.id, summary: `Added ${t} section to ${page.title}` });
    revalidatePath("/admin/homepage");
    return { ok: true, message: "Section added (hidden until you enable it)." };
  });
}

// ── Settings ────────────────────────────────────────────────

export async function saveSettingsAction(group: string, _prev: Result, form: FormData): Promise<Result> {
  return guarded(async () => {
    if (!(group in SETTING_GROUPS)) return { ok: false, message: "Unknown settings group." };
    const g = group as SettingGroup;
    const user = await requirePermission(SETTING_GROUPS[g].permission);
    const fields = SETTINGS.filter((s) => s.group === g);
    const errors: Record<string, string[]> = {};
    const values: Record<string, Prisma.InputJsonValue> = {};
    for (const f of fields) {
      const raw = form.get(f.key);
      if (f.type === "boolean") values[f.key] = raw === "on";
      else if (f.type === "list") values[f.key] = String(raw ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 30);
      else {
        const v = String(raw ?? "").trim().slice(0, 2000);
        if (f.type === "url" && v && !/^https:\/\/\S+$/i.test(v)) errors[f.key] = ["Must be a full https:// URL."];
        if (f.type === "email" && v && !z.email().safeParse(v).success) errors[f.key] = ["Invalid email address."];
        if (f.type === "select" && f.options && !f.options.includes(v)) errors[f.key] = ["Invalid option."];
        if (f.key === "analytics.gaMeasurementId" && v && !/^G-[A-Z0-9]{4,20}$/.test(v)) errors[f.key] = ["Expected a GA4 ID like G-ABC123XYZ."];
        if (f.key === "contact.mapEmbedUrl" && v && !v.startsWith("https://www.google.com/maps/embed")) errors[f.key] = ["Must be a Google Maps embed URL."];
        values[f.key] = v;
      }
    }
    if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: errors };
    await prisma.$transaction(
      fields.map((f) =>
        prisma.siteSetting.upsert({
          where: { key: f.key },
          update: { value: values[f.key]! },
          create: { key: f.key, value: values[f.key]!, group: f.group, isPublic: f.isPublic ?? true },
        }),
      ),
    );
    await logActivity({ userId: user.id, action: "update", entityType: "settings", entityId: g, summary: `Updated ${SETTING_GROUPS[g].title}` });
    await invalidateEntity("settings");
    refreshSite();
    return { ok: true, message: "Settings saved." };
  });
}

// ── Users ───────────────────────────────────────────────────

const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(191),
  password: z.string().max(128),
  isActive: z.boolean(),
  roleIds: z.array(z.string().max(191)).min(1, "Assign at least one role."),
});

export async function saveUserAction(userId: string | null, _prev: Result, form: FormData): Promise<Result> {
  return guarded(async () => {
    const actor = await requirePermission("users.manage");
    const parsed = userSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      password: String(form.get("password") ?? ""),
      isActive: form.get("isActive") === "on",
      roleIds: form.getAll("roleIds").map(String),
    });
    if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
    const d = parsed.data;
    if (!userId || d.password) {
      const policy = passwordPolicyError(d.password);
      if (policy) return { ok: false, fieldErrors: { password: [policy] }, message: policy };
    }
    const clash = await prisma.user.findFirst({ where: { email: d.email, ...(userId ? { NOT: { id: userId } } : {}) }, select: { id: true } });
    if (clash) return { ok: false, message: "That email is already in use.", fieldErrors: { email: ["Already in use."] } };
    const roles = await prisma.role.findMany({ where: { id: { in: d.roleIds } } });
    if (roles.length !== d.roleIds.length) return { ok: false, message: "Unknown role selected." };
    const givesSuper = roles.some((r) => r.key === "super_admin");
    if (givesSuper && !actor.roles.some((r) => r.key === "super_admin")) return { ok: false, message: "Only a Super Admin can grant the Super Admin role." };

    if (userId) {
      const existing = await prisma.user.findFirst({ where: { id: userId, deletedAt: null }, include: { roles: { include: { role: true } } } });
      if (!existing) return { ok: false, message: "User not found." };
      if (userId === actor.id && (!d.isActive || (!givesSuper && actor.roles.some((r) => r.key === "super_admin")))) {
        return { ok: false, message: "You can't deactivate yourself or remove your own Super Admin role." };
      }
      const wasSuper = existing.roles.some((r) => r.role.key === "super_admin");
      if (wasSuper && (!givesSuper || !d.isActive)) {
        const supers = await prisma.user.count({ where: { deletedAt: null, isActive: true, roles: { some: { role: { key: "super_admin" } } } } });
        if (supers <= 1) return { ok: false, message: "At least one active Super Admin must remain." };
      }
      const rolesChanged = existing.roles.map((r) => r.roleId).sort().join() !== [...d.roleIds].sort().join();
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            name: d.name,
            email: d.email,
            isActive: d.isActive,
            ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}),
            // Revoke sessions on password change, deactivation or role change.
            ...(d.password || !d.isActive || rolesChanged ? { sessionVersion: { increment: 1 } } : {}),
          },
        }),
        prisma.userRole.deleteMany({ where: { userId } }),
        prisma.userRole.createMany({ data: d.roleIds.map((roleId) => ({ userId, roleId })) }),
      ]);
      await logActivity({ userId: actor.id, action: "update", entityType: "user", entityId: userId, summary: `Updated user ${d.email}` });
      revalidatePath("/admin/users");
      return { ok: true, message: "User saved.", id: userId };
    }
    const created = await prisma.user.create({
      data: { name: d.name, email: d.email, isActive: d.isActive, passwordHash: await hashPassword(d.password), roles: { create: d.roleIds.map((roleId) => ({ roleId })) } },
    });
    await logActivity({ userId: actor.id, action: "create", entityType: "user", entityId: created.id, summary: `Created user ${d.email}` });
    revalidatePath("/admin/users");
    return { ok: true, message: "User created.", id: created.id };
  });
}

export async function userOpAction(userId: string, op: "revoke" | "delete"): Promise<Result> {
  return guarded(async () => {
    const actor = await requirePermission("users.manage");
    const uid = id.parse(userId);
    if (uid === actor.id && op === "delete") return { ok: false, message: "You can't delete your own account." };
    const target = await prisma.user.findFirst({ where: { id: uid, deletedAt: null }, include: { roles: { include: { role: true } } } });
    if (!target) return { ok: false, message: "User not found." };
    if (op === "delete" && target.roles.some((r) => r.role.key === "super_admin")) {
      const supers = await prisma.user.count({ where: { deletedAt: null, isActive: true, roles: { some: { role: { key: "super_admin" } } } } });
      if (supers <= 1) return { ok: false, message: "At least one active Super Admin must remain." };
    }
    await prisma.user.update({
      where: { id: uid },
      data: op === "revoke" ? { sessionVersion: { increment: 1 } } : { deletedAt: new Date(), isActive: false, sessionVersion: { increment: 1 }, email: `deleted-${Date.now()}-${target.email}`.slice(0, 191) },
    });
    await logActivity({ userId: actor.id, action: op === "revoke" ? "revoke_sessions" : "delete", entityType: "user", entityId: uid, summary: `${op === "revoke" ? "Signed out" : "Deleted"} ${target.email}` });
    revalidatePath("/admin/users");
    return { ok: true, message: op === "revoke" ? "All sessions for this user were signed out." : "User deleted." };
  });
}

// ── Roles & permissions ─────────────────────────────────────

export async function saveRolePermissionsAction(_prev: Result, form: FormData): Promise<Result> {
  return guarded(async () => {
    const actor = await requirePermission("roles.manage");
    const roles = await prisma.role.findMany();
    const perms = await prisma.permission.findMany();
    const permId = new Map(perms.map((p) => [p.key, p.id]));
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    for (const role of roles) {
      if (role.key === "super_admin") continue; // always full access
      const keys = form.getAll(`role:${role.id}`).map(String).filter(isPermission);
      ops.push(prisma.rolePermission.deleteMany({ where: { roleId: role.id } }));
      if (keys.length) ops.push(prisma.rolePermission.createMany({ data: keys.map((k) => ({ roleId: role.id, permissionId: permId.get(k)! })).filter((x) => x.permissionId) }));
    }
    // Permissions are loaded fresh from the DB on every request, so changes apply immediately.
    await prisma.$transaction(ops);
    await logActivity({ userId: actor.id, action: "update", entityType: "roles", summary: "Updated role permissions" });
    revalidatePath("/admin/roles");
    return { ok: true, message: "Permissions saved. They apply immediately." };
  });
}

// ── Maintenance ─────────────────────────────────────────────

export async function maintenanceAction(op: "flush-cache" | "publish-scheduled" | "purge-analytics" | "purge-login-attempts"): Promise<Result> {
  return guarded(async () => {
    const actor = await requirePermission("maintenance.manage");
    let message = "";
    if (op === "flush-cache") {
      const n = await invalidateAll();
      refreshSite();
      message = `Cache cleared (${n} Redis keys) and pages revalidated.`;
    } else if (op === "publish-scheduled") {
      const r = await prisma.blogPost.updateMany({ where: { status: "SCHEDULED", scheduledFor: { lte: new Date() }, deletedAt: null }, data: { status: "PUBLISHED" } });
      await invalidateEntity("blog");
      refreshSite();
      message = `${r.count} scheduled post(s) published.`;
    } else if (op === "purge-analytics") {
      const r = await prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 365 * 86_400_000) } } });
      message = `Removed ${r.count} analytics events older than 12 months.`;
    } else {
      const r = await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 86_400_000) } } });
      message = `Removed ${r.count} login attempt records older than 90 days.`;
    }
    await logActivity({ userId: actor.id, action: op, entityType: "maintenance", summary: message });
    return { ok: true, message };
  });
}
