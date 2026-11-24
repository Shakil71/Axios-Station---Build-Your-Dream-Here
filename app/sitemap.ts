import type { MetadataRoute } from "next";
import { sitemapEntries } from "@/services/public";
import { siteUrl } from "@/lib/utils";
import { localizeHref, locales } from "@/lib/i18n";

export const revalidate = 3600;

/** Every public URL in every language, each linked to its other-language versions (hreflang). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const e = await sitemapEntries();
  const now = new Date();
  type Row = { path: string; lastModified: Date; priority: number; changeFrequency?: "weekly"; image?: string };
  const img = (r: { coverImage?: { url: string } | null }) => r.coverImage?.url;
  const rows: Row[] = [
    ...["/", "/about", "/services", "/solutions", "/industries", "/portfolio", "/team", "/blog", "/contact"].map((p) => ({
      path: p,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: p === "/" ? 1 : 0.8,
    })),
    ...e.services.map((r) => ({ path: `/services/${r.slug}`, lastModified: r.updatedAt, priority: 0.8, image: img(r) })),
    ...e.solutions.map((r) => ({ path: `/solutions/${r.slug}`, lastModified: r.updatedAt, priority: 0.8, image: img(r) })),
    ...e.industries.map((r) => ({ path: `/industries/${r.slug}`, lastModified: r.updatedAt, priority: 0.7, image: img(r) })),
    ...e.projects.map((r) => ({ path: `/portfolio/${r.slug}`, lastModified: r.updatedAt, priority: 0.7, image: img(r) })),
    ...e.posts.map((r) => ({ path: `/blog/${r.slug}`, lastModified: r.updatedAt, priority: 0.7, image: img(r) })),
    ...e.pages.map((r) => ({ path: `/${r.slug}`, lastModified: r.updatedAt, priority: 0.4 })),
  ];
  return rows.flatMap((r) => {
    const languages = Object.fromEntries(locales.map((l) => [l, siteUrl(localizeHref(r.path, l))]));
    return locales.map((l) => ({
      url: siteUrl(localizeHref(r.path, l)),
      lastModified: r.lastModified,
      ...(r.changeFrequency ? { changeFrequency: r.changeFrequency } : {}),
      priority: l === "en" ? r.priority : Math.round(r.priority * 9) / 10,
      alternates: { languages },
      ...(r.image ? { images: [r.image.startsWith("http") ? r.image : siteUrl(r.image)] } : {}),
    }));
  });
}
