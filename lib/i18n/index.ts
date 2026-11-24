/**
 * Multilingual foundation (client- and server-safe).
 *
 * - English is the default and lives at unprefixed URLs (/services).
 * - Bengali lives under /bn (/bn/services). proxy.ts rewrites unprefixed
 *   URLs to the internal /en/... route, so every page is statically
 *   generated once per language.
 * - UI strings: lib/i18n/dictionary.ts. CMS content: the Translation table.
 */
import { dictionaries, type DictKey } from "./dictionary";

export const locales = ["en", "bn"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export type { DictKey };

export const localeNames: Record<Locale, string> = { en: "English", bn: "বাংলা" };
export const htmlLang: Record<Locale, string> = { en: "en", bn: "bn" };
export const ogLocale: Record<Locale, string> = { en: "en_US", bn: "bn_BD" };
export const dateLocale: Record<Locale, string> = { en: "en-US", bn: "bn-BD" };

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (locales as readonly string[]).includes(v);
}

/** Translate a UI string, filling {placeholders}. */
export function t(lang: Locale, key: DictKey, vars?: Record<string, string | number>): string {
  let s: string = dictionaries[lang]?.[key] ?? dictionaries.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** A translator bound to one locale. */
export function translator(lang: Locale) {
  return (key: DictKey, vars?: Record<string, string | number>) => t(lang, key, vars);
}

/** Paths that are never localised (admin, API, static files, external links, anchors). */
function isLocalisable(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  if (/^\/(admin|api|_next|images|uploads)(\/|$|\?)/.test(href)) return false;
  const pathOnly = href.split(/[?#]/)[0] ?? "";
  if (/\.[a-z0-9]{2,12}$/i.test(pathOnly)) return false; // files: /sitemap.xml, /icon.png, /manifest.webmanifest
  return true;
}

/** Remove a locale prefix: /bn/services → /services, /bn → /. */
export function stripLocale(path: string): string {
  const m = path.match(/^\/(en|bn)(?=\/|$|\?|#)(.*)$/);
  if (!m) return path;
  const rest = m[2] ?? "";
  return rest === "" || rest.startsWith("?") || rest.startsWith("#") ? `/${rest}` : rest;
}

/** Locale of a public pathname. */
export function localeFromPath(path: string): Locale {
  return /^\/bn(\/|$|\?|#)/.test(path) ? "bn" : "en";
}

/** Prefix an internal link for the given locale. English links stay unprefixed. */
export function localizeHref(href: string, lang: Locale): string {
  if (!isLocalisable(href)) return href;
  const base = stripLocale(href);
  if (lang === defaultLocale) return base;
  if (base === "/") return `/${lang}`;
  if (base.startsWith("/?") || base.startsWith("/#")) return `/${lang}${base.slice(1)}`;
  return `/${lang}${base}`;
}
