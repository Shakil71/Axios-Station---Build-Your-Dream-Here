import "server-only";
import { cache } from "react";
import { defaultLocale, isLocale, translator, type Locale } from "./index";

/**
 * Request-scoped locale. Every page, layout and generateMetadata under
 * app/[lang] calls setLocale(lang) first; nested server components and the
 * public data layer then read it with getLocale(), so the locale doesn't
 * have to be threaded through every component.
 */
const store = cache((): { lang: Locale } => ({ lang: defaultLocale }));

export function setLocale(lang: Locale) {
  store().lang = lang;
}

export function getLocale(): Locale {
  return store().lang;
}

/** Translator for the current request's locale. */
export function getT() {
  return translator(getLocale());
}

/** Resolve the [lang] route param, register it for this request and return the locale. */
export function initLocale(lang: string | undefined): Locale {
  const l = isLocale(lang) ? lang : defaultLocale;
  setLocale(l);
  return l;
}
