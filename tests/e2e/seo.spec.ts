import { expect, test } from "@playwright/test";

/** Technical SEO: metadata, structured data, feeds and crawler files. */
const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]!) as Record<string, unknown>);

test.describe("seo", () => {
  test.skip(({ isMobile }) => isMobile, "server-side checks run once");

  test("homepage has a keyword title, description, social image, canonical, hreflang and RSS link", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).toMatch(/<title>[^<]*Bangladesh[^<]*<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]{80,}"/);
    expect(html).toMatch(/<meta property="og:image" content="[^"]+og-default\.png"/);
    expect(html).toMatch(/<link rel="canonical" href="[^"]+"/);
    expect(html).toMatch(/hrefLang="bn"/);
    expect(html).toContain('type="application/rss+xml"');
    expect(html).toContain('rel="manifest"');
  });

  test("every key page has valid structured data linked to one organisation", async ({ request }) => {
    for (const path of ["/", "/bn", "/services/custom-software-development", "/blog/zkteco-fingerprint-attendance-integration", "/team"]) {
      const blocks = jsonLd(await (await request.get(path)).text());
      expect(blocks.length, path).toBeGreaterThan(0);
      const graph = blocks.flatMap((b) => (Array.isArray(b["@graph"]) ? (b["@graph"] as Record<string, unknown>[]) : [b]));
      const org = graph.find((g) => String(g["@id"] ?? "").endsWith("#organization"));
      expect(org, path).toBeTruthy();
      expect(graph.some((g) => g["@type"] === "WebSite"), path).toBe(true);
    }
  });

  test("blog posts are articles with an image and publisher", async ({ request }) => {
    const blocks = jsonLd(await (await request.get("/blog/zkteco-fingerprint-attendance-integration")).text());
    const article = blocks.find((b) => b["@type"] === "BlogPosting")!;
    expect(article).toBeTruthy();
    expect(article.image).toBeTruthy();
    expect(article.publisher).toBeTruthy();
    expect(article.datePublished).toBeTruthy();
  });

  test("crawler files: robots, sitemap with images, RSS, manifest, llms.txt", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("<image:loc>");
    expect(sitemap).toContain("/bn/blog/");

    const feed = await request.get("/feed.xml");
    expect(feed.headers()["content-type"]).toContain("application/rss+xml");
    expect((await feed.text()).match(/<item>/g)?.length ?? 0).toBeGreaterThan(0);

    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.status()).toBe(200);
    expect((await manifest.json()).name).toBe("Axios Station");

    const llms = await (await request.get("/llms.txt")).text();
    expect(llms).toContain("## Services");
    expect(llms).toContain("/services/");
  });
});
