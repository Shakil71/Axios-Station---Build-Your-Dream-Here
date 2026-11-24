import "server-only";
import { prisma, safeQuery } from "@/lib/db/prisma";
import { cached } from "@/lib/redis/cache";
import { cacheKeys } from "@/lib/redis/keys";
import { defaultLocale, type Locale } from "./index";
import { parseItems, parseList, parseStats, TRANSLATABLE } from "./translatable";

/**
 * CMS content translations. English content is read and cached as usual;
 * for other locales the matching Translation rows are layered on top.
 * A missing or empty translation falls back to English field by field.
 */
type TMap = Record<string, string>;
const k = (id: string, field: string) => `${id}␟${field}`;

export async function translationMap(entity: string, lang: Locale): Promise<TMap> {
  if (lang === defaultLocale) return {};
  return cached(cacheKeys.i18n(entity, lang), async () => {
    const rows = await safeQuery(
      () => prisma.translation.findMany({ where: { entityType: entity, locale: lang }, select: { entityId: true, field: true, value: true } }),
      [],
      `i18n:${entity}`,
    );
    const m: TMap = {};
    for (const r of rows) if (r.value.trim()) m[k(r.entityId, r.field)] = r.value;
    return m;
  });
}

/** Replace translatable fields of one object (by its entity id) with their translations. */
export function overlay<T extends object>(entity: string, id: string, obj: T, map: TMap): T {
  const fields = TRANSLATABLE[entity];
  if (!fields || !id) return obj;
  let out: T | null = null;
  for (const f of fields) {
    if (!(f.name in obj)) continue;
    const v = map[k(id, f.name)];
    if (!v) continue;
    const parsed = f.kind === "list" ? parseList(v) : f.kind === "items" ? parseItems(v) : f.kind === "stats" ? parseStats(v) : v;
    if (Array.isArray(parsed) && parsed.length === 0) continue;
    out ??= { ...obj };
    (out as Record<string, unknown>)[f.name] = parsed;
  }
  return out ?? obj;
}

/** Localise a list of objects that carry their own `id`. */
export async function localizeAll<T extends { id: string }>(entity: string, rows: T[], lang: Locale): Promise<T[]> {
  if (lang === defaultLocale || rows.length === 0) return rows;
  const map = await translationMap(entity, lang);
  return rows.map((r) => overlay(entity, r.id, r, map));
}

export async function localizeOne<T extends { id: string }>(entity: string, row: T, lang: Locale): Promise<T> {
  return (await localizeAll(entity, [row], lang))[0]!;
}

/** Translated value of a single string (settings, menu headings…), or the fallback. */
export async function translatedValue(entity: string, id: string, field: string, lang: Locale, fallback: string): Promise<string> {
  if (lang === defaultLocale) return fallback;
  const map = await translationMap(entity, lang);
  return map[k(id, field)] ?? fallback;
}
