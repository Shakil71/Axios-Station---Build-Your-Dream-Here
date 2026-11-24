import "server-only";
import type { Metadata } from "next";
import { getSeo, getSettings } from "@/services/public";
import { str } from "@/lib/settings-schema";
import { siteUrl } from "@/lib/utils";
import { defaultLocale, localizeHref, locales, ogLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

export const DEFAULT_OG_IMAGE = "/images/brand/og-default.png";

/**
 * Build page metadata from sensible defaults, overridden by whatever an
 * admin configured for this path in SEO Management. `path` is the
 * language-neutral path (/services); the current locale is applied here.
 *
 * SEO Management texts are written in English, so for other languages only
 * the language-neutral parts (noindex, OG image) are applied.
 */
export async function buildMetadata(
  path: string,
  defaults: { title: string; description?: string | null; image?: string | null; type?: "website" | "article"; publishedTime?: string | null },
): Promise<Metadata> {
  const lang = getLocale();
  const [seo, settings] = await Promise.all([getSeo(path), getSettings()]);
  const own = lang === defaultLocale ? seo : null;
  const title = own?.metaTitle || defaults.title;
  const description = own?.metaDescription || defaults.description || str(settings, "site.description");
  // Page image → admin override → branded default, so every shared link gets a preview card.
  const image = seo?.ogImageUrl || defaults.image || DEFAULT_OG_IMAGE;
  const ogImage = image === DEFAULT_OG_IMAGE ? { url: image, width: 1200, height: 630, alt: str(settings, "site.name") || "Axios Station" } : { url: image };
  const canonical = (lang === defaultLocale && seo?.canonicalUrl) || siteUrl(localizeHref(path, lang));
  const languages: Record<string, string> = Object.fromEntries(locales.map((l) => [l, siteUrl(localizeHref(path, l))]));
  languages["x-default"] = siteUrl(path);
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    keywords: own?.keywords?.split(",").map((k) => k.trim()).filter(Boolean),
    // Page-level alternates replace the layout's, so the RSS link is repeated here.
    alternates: { canonical, languages, types: { "application/rss+xml": [{ url: "/feed.xml", title: "Axios Station — Blog" }] } },
    robots: seo?.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      type: defaults.type ?? "website",
      locale: ogLocale[lang],
      siteName: str(settings, "site.name") || "Axios Station",
      images: [ogImage],
      ...(defaults.publishedTime ? { publishedTime: defaults.publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
