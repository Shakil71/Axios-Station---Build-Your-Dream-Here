import { getSettings, listPosts } from "@/services/public";
import { str } from "@/lib/settings-schema";
import { siteUrl } from "@/lib/utils";

export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS 2.0 feed of the latest blog articles (linked from every page's <head>). */
export async function GET() {
  const [settings, { items }] = await Promise.all([getSettings("en"), listPosts({ perPage: 30 }, "en")]);
  const name = str(settings, "site.name") || "Axios Station";
  const entries = items
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${siteUrl(`/blog/${p.slug}`)}</link>
      <guid isPermaLink="true">${siteUrl(`/blog/${p.slug}`)}</guid>
      <description>${esc(p.excerpt)}</description>
      ${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ""}
      ${p.category ? `<category>${esc(p.category.name)}</category>` : ""}
      ${p.cover ? `<enclosure url="${esc(p.cover.url.startsWith("http") ? p.cover.url : siteUrl(p.cover.url))}" type="${p.cover.url.endsWith(".png") ? "image/png" : p.cover.url.endsWith(".jpg") ? "image/jpeg" : "image/webp"}" length="0"/>` : ""}
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(name)} — Blog</title>
    <link>${siteUrl("/blog")}</link>
    <description>${esc(str(settings, "site.description"))}</description>
    <language>en</language>
    <atom:link href="${siteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>
${entries}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
