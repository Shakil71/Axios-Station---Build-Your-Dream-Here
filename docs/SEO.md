# SEO guide — Axios Station

The website is technically ready for search engines. Rankings now depend mostly on the off-site work below: the
domain, Google Business Profile, reviews, links and regular content. Nobody can guarantee a #1 position. These steps
are what consistently move a local technology company up the results.

## What the website already does

| Area | What is in place |
|---|---|
| Titles & descriptions | Keyword-focused for 19 key pages (Admin → SEO), within Google's display length; Bengali titles from the dictionary |
| Languages | English at `/…`, Bengali at `/bn/…`, `hreflang` + `x-default`, per-language canonical URLs |
| Structured data | Organization (+ ProfessionalService once an address is set), WebSite, Service, FAQPage, BlogPosting, Person, BreadcrumbList — all linked to one organisation id |
| Crawling | `robots.txt`, bilingual `sitemap.xml` with images, RSS `/feed.xml`, `/llms.txt` for AI search, web manifest |
| Social previews | Branded 1200×630 image on every page (override per page in Admin → SEO or with a cover image) |
| Fast indexing | IndexNow pings Bing, Yandex and others when content is published (set `INDEXNOW_KEY`) |
| Quality | Lighthouse SEO 100, Accessibility 98–100, Best Practices 100; pages are pre-rendered and fast |

## Launch checklist (do once)

1. **Domain and HTTPS.** Set `NEXT_PUBLIC_SITE_URL` to the real `https://` domain before going live. Canonical URLs,
   the sitemap and social previews are built from it.
2. **Google Search Console** (search.google.com/search-console):
   1. Add the domain property.
   2. Paste the verification token into Admin → Settings → Analytics → Google Search Console.
   3. Submit `https://YOUR-DOMAIN/sitemap.xml`.
3. **Bing Webmaster Tools** (bing.com/webmasters). Bing also powers DuckDuckGo, Yahoo and ChatGPT search.
   1. Import the site from Search Console, or paste the token into Admin → Settings → Analytics.
   2. Submit the sitemap.
4. **IndexNow.** Put a random key (for example a UUID) in `INDEXNOW_KEY` on the server.
5. **Google Analytics.** Add the GA4 measurement ID in Admin → Settings → Analytics. It loads only after visitor consent.
6. **Contact details.** Fill in Admin → Contact Information (email, phone, WhatsApp, address, hours). Once the address
   is set, the site describes the company as a local business, which helps Google Maps results.
7. **Social profiles.** Add every official profile in Admin → Social Links (Facebook, LinkedIn, YouTube…). They are
   listed as `sameAs` in the structured data.

## Local SEO (biggest impact for "software company in Bangladesh / Cox's Bazar")

- **Google Business Profile** (business.google.com):
  - Category: "Software company". Use the same name, address and phone as the website.
  - Add photos of the team and office, the services list and working hours.
- Ask satisfied clients, starting with Hotel Sea Paradise if they agree, for an honest **Google review**. Reply to
  every review.
- Keep the company name, address and phone **identical everywhere**: website, Google, Facebook page, LinkedIn,
  directories.

## Authority (links from other sites)

- **Company listings:** LinkedIn company page, Facebook page, Clutch, GoodFirms, and the BASIS member directory if you
  join BASIS.
- **Partner links:** ask clients and partners to link to you, for example a "Website/software by Axios Station" credit
  or a case-study mention, but only with their agreement.
- **Personal profiles:** team members can link to the site from their LinkedIn profiles. Add those profile links in
  Admin → Team.
- **Avoid paid link schemes.** Google penalises them.

## Content plan

- Publish one useful article every 2–4 weeks in Admin → Blog. Answer questions customers actually ask:
  - prices and timelines
  - "ERP vs accounting software"
  - "how to choose a POS"
  - hotel software for Cox's Bazar
  - HR & attendance
  - digital marketing tips
- Link each article to the related service or solution page, and link back from the service pages where relevant.
- Add case studies as soon as projects can be published, with **verified** results and real screenshots.
- Add the Bengali version of popular articles (Bengali translation panel) to rank for Bengali searches too.
- Replace illustrations with real photos over time (team, office, delivered work). Real images earn more trust and
  clicks.

## Monthly routine (30 minutes)

1. Search Console → Performance: which queries bring impressions. Improve the titles and descriptions of pages that
   appear often but get few clicks (Admin → SEO).
2. Search Console → Pages: fix anything "not indexed" that should be.
3. Check new Google reviews and reply.
4. Publish or update at least one article.

## Where things live in the code

- Page metadata: `lib/seo.ts` (`buildMetadata`). Admin overrides: the `SEO` table. Defaults: `lib/content/seo.ts`.
- Structured data: `components/seo/json-ld.tsx`
- Sitemap, robots, feed, llms.txt, manifest: `app/sitemap.ts`, `app/robots.ts`, `app/feed.xml/route.ts`,
  `app/llms.txt/route.ts`, `app/manifest.ts`
- IndexNow: `lib/indexnow.ts` (called after admin saves in `services/admin/crud.ts`)
