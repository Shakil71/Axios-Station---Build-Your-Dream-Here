import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { logActivity } from "@/lib/db/activity";
import { invalidateEntity } from "@/lib/redis/cache";
import { RESOURCE_ENTITY, TRANSLATABLE, TRANSLATABLE_SETTINGS, type TranslatableKind } from "@/lib/i18n/translatable";
import { SETTINGS } from "@/lib/settings-schema";
import type { CurrentUser } from "@/lib/auth/guard";

/** Languages editable in the admin (English is the source and is edited in the normal form). */
export const TRANSLATION_LOCALE = "bn";

export type TranslationTarget =
  | { scope: "resource"; key: string; id: string }
  | { scope: "section"; id: string }
  | { scope: "settings"; group: string };

export type TranslationRow = { entityId: string; field: string; label: string; kind: TranslatableKind; english: string; value: string };

export const fieldName = (entityId: string, field: string) => `tr::${entityId}::${field}`;

/** Fields a target may write: entity type + allowed (entityId, field) pairs. Never trusts the client. */
export function allowedFields(target: TranslationTarget): { entity: string; pairs: { entityId: string; field: string }[] } | null {
  if (target.scope === "resource") {
    const entity = RESOURCE_ENTITY[target.key];
    if (!entity) return null;
    return { entity, pairs: (TRANSLATABLE[entity] ?? []).map((f) => ({ entityId: target.id, field: f.name })) };
  }
  if (target.scope === "section") {
    return { entity: "pageSection", pairs: TRANSLATABLE.pageSection!.map((f) => ({ entityId: target.id, field: f.name })) };
  }
  const keys = SETTINGS.filter((s) => s.group === target.group && (TRANSLATABLE_SETTINGS as readonly string[]).includes(s.key)).map((s) => s.key);
  return { entity: "setting", pairs: keys.map((k) => ({ entityId: k, field: "value" })) };
}

/** Existing translations for the given entity ids, keyed by form field name. */
export async function loadTranslations(entity: string, entityIds: string[]): Promise<Record<string, string>> {
  if (!entityIds.length) return {};
  const rows = await prisma.translation.findMany({
    where: { entityType: entity, entityId: { in: entityIds }, locale: TRANSLATION_LOCALE },
    select: { entityId: true, field: true, value: true },
  });
  return Object.fromEntries(rows.map((r) => [fieldName(r.entityId, r.field), r.value]));
}

/** Build panel rows for one entity from its English values. */
export async function translationRows(entity: string, entityId: string, english: Record<string, unknown>, only?: string[]): Promise<TranslationRow[]> {
  const fields = (TRANSLATABLE[entity] ?? []).filter((f) => !only || only.includes(f.name));
  const existing = await loadTranslations(entity, [entityId]);
  return fields.map((f) => ({
    entityId,
    field: f.name,
    label: f.label,
    kind: f.kind,
    english: toText(english[f.name]),
    value: existing[fieldName(entityId, f.name)] ?? "",
  }));
}

function toText(v: unknown): string {
  if (Array.isArray(v)) return v.map(String).join("\n");
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

const MAX = { text: 1000, textarea: 20_000, list: 20_000, items: 50_000, stats: 5000, richtext: 200_000 } as const;

/** Upsert (or clear) the submitted translations of one target. */
export async function saveTranslations(target: TranslationTarget, user: CurrentUser, form: FormData): Promise<{ ok: boolean; message: string }> {
  const allowed = allowedFields(target);
  if (!allowed) return { ok: false, message: "This content can't be translated." };

  if (target.scope === "section" && !(await prisma.pageSection.findUnique({ where: { id: target.id }, select: { id: true } }))) {
    return { ok: false, message: "Section not found." };
  }

  const kinds = new Map((TRANSLATABLE[allowed.entity] ?? []).map((f) => [f.name, f.kind]));
  let changed = 0;
  for (const { entityId, field } of allowed.pairs) {
    const raw = form.get(fieldName(entityId, field));
    if (typeof raw !== "string") continue; // field not shown → leave untouched
    const value = raw.replace(/\r\n/g, "\n").trim();
    const limit = MAX[kinds.get(field) ?? "textarea"];
    if (value.length > limit) return { ok: false, message: `"${field}" is too long (max ${limit.toLocaleString()} characters).` };
    const where = { entityType_entityId_field_locale: { entityType: allowed.entity, entityId, field, locale: TRANSLATION_LOCALE } };
    if (!value) {
      changed += (await prisma.translation.deleteMany({ where: where.entityType_entityId_field_locale })).count;
    } else {
      await prisma.translation.upsert({
        where,
        create: { ...where.entityType_entityId_field_locale, value },
        update: { value },
      });
      changed++;
    }
  }

  await logActivity({
    userId: user.id,
    action: "update",
    entityType: "translation",
    entityId: target.scope === "settings" ? target.group : target.id,
    summary: `Updated Bengali translation (${allowed.entity})`,
  });
  await invalidateEntity("translation");
  revalidatePath("/", "layout");
  return { ok: true, message: changed ? "Bengali translation saved." : "Nothing to save." };
}
