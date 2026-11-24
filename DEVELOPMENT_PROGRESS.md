# Development Progress

_Last updated: 2026-11-24_

## Verification status

| Check | Result |
|---|---|
| `tsc --noEmit` (strict) | ✅ passes |
| `eslint .` | ✅ 0 errors, 0 warnings |
| `vitest run` | ✅ 39/39 unit tests (security, RBAC matrix, validation, cache keys, CSV, rate-limit reset, i18n URLs/dictionary/formats) |
| `next build` | ✅ production build succeeds |
| `prisma migrate deploy` + `npm run db:seed` on local MySQL 8.0 | ✅ applied; seed verified idempotent (re-run creates no duplicates) |
| Playwright e2e — full suite against MySQL (desktop + mobile) | ✅ 82 passed, 6 skipped (device-specific tests are skipped on the other device by design) |
| ↳ public pages, security headers, no overflow, 404, sitemap/robots, contact validation, service detail | ✅ |
| ↳ admin protection: anonymous redirect, admin APIs 403, wrong password rejected | ✅ |
| ↳ admin CRUD: sign in → create service → live on site → unpublish (404) → delete | ✅ |
| ↳ all 43 admin screens render; contact form → lead → status change → history → delete; media upload → alt text → delete; in-use media deletion blocked | ✅ |
| Redis live test | ⏳ not run (Redis not installed locally). Fallback to MySQL verified. |
| Lighthouse 12 (production build, local) | ✅ Accessibility, Best Practices and SEO 100 on home, team, services and privacy. Performance: desktop 99–100; mobile 75–82 (simulated slow 4G with 4× CPU throttling; the remainder is the React/Next runtime) |

## Phases

### Phase 1 — Foundation ✅
Next.js 16 / React 19 / TS strict / Tailwind 4 / Prisma 7 + MariaDB adapter / ioredis / Auth.js v5 / Zod 4.
Env validation (`lib/env.ts`), `.env.example`.

### Phase 2 — Public website ✅
Design system with brand tokens from the logo, dark/light themes, glass surfaces, Sora + Manrope fonts, and
reduced-motion support. Pages: home (15 CMS-driven section types), about, services and 17 detail pages, solutions
and 13 detail pages, industries and 10 detail pages, portfolio (filter, debounced search, pagination, detail,
gallery, Demo badge), team, blog (categories, tags, search, pagination, related posts, share), contact (full lead
form), CMS pages by slug (privacy/terms…), unsubscribe, 404/error. Custom animated hero illustration. Logo mark and
favicons extracted from the brand logo.

### Phase 3 — Data, auth, RBAC ✅
Normalised schema with 35 models (all requested, plus PasswordResetToken, LoginAttempt, LeadNote, ProjectCategory,
ProjectService and Translation), indexes, unique slugs, soft deletes, timestamps. Initial migration and idempotent
seed. Five roles and 24 permissions are enforced server-side.

### Phase 4 — CMS ✅ (pending live-DB verification)
Dashboard (real figures only). Generic CRUD for services, solutions, industries, portfolio, project categories, team,
blog posts/categories/tags, testimonials, FAQs, pages, SEO, redirects and navigation. Also: homepage/about builder
(enable/disable, reorder, edit, add/remove sections, images, stats, CTAs), media library (drag-and-drop upload,
optimisation, alt text, reference tracking, blocked deletion), leads (pipeline statuses, assignment, notes, email
reply, history, CSV), newsletter (CSV, unsubscribe), settings (website, contact, social, theme, footer, lead form,
analytics), users, roles matrix, activity logs, analytics, AI status, and backup & maintenance.

### Phase 5 — Cache, email, analytics, AI ✅
Redis read-through cache + entity invalidation, SMTP notifications (lead alert, visitor acknowledgement, reset
emails, replies), consent-gated GA4, cookieless first-party page views, and the AI provider adapter layer.

### Phase 6 — Hardening & QA 🟡
Done: CSP and security headers, rate limits, lockout, upload validation, sanitisation, and the tests listed above,
run against a real database. Bugs found and fixed while testing against MySQL:
- `AUTH_SECRET` was empty, so sign-in failed. A startup check now reports it clearly.
- Successful logins counted towards the per-account rate limit. The counter now resets on success.
- The seed duplicated the general FAQs on re-run.
- Database outages caused 8 s stalls and noisy logs. A circuit breaker now skips the DB briefly and logs the real
  cause once.
- The seed now shows the real MySQL error instead of the generic "pool failed" message.

Lighthouse pass (2026-11-24):
- Scroll-reveal animations are now pure CSS (scroll-driven, with a no-JS fallback). Content no longer waits for
  hydration; mobile LCP dropped from 4.4 s to about 2.9 s.
- framer-motion was removed from the site header; it now loads only for the hero illustration.
- Contrast for the `--subtle` text tokens now meets WCAG AA in both themes. Fixed process-list semantics, the logo
  link's accessible name and heading order on listing pages.
- Zod runs in jitless mode, so it no longer trips the CSP `eval` check.

To do: Redis live test.

### Phase 7 — Ops docs ✅
`docs/DEPLOYMENT.md`, Nginx config, PM2 ecosystem, backup scripts, scheduled-publish cron.

### Content update (2026-11-24)
- Founded in 2024. The homepage intro shows "Founded 2024 · 2+ years building", and the About page has a milestones timeline.
- New case study: Hotel Sea Paradise, Cox's Bazar. Employee Management Software with ZKTeco fingerprint attendance
  integration and ongoing support. No metrics are stated until they are verified.
- Original illustrations: `scripts/generate-artwork.mjs` renders SVG to WebP in `public/images/{portfolio,brand}`.
  Images that show a product UI or flow carry a visible "Illustration" tag and say "Illustration" in their alt text.
- The seed's `backfillContent()` fills new content only where a section is still empty, so admin edits are never
  overwritten.
- Homepage visual upgrade:
  - A new `showcase` section type (featured live work), with a laptop and fingerprint-terminal illustration.
  - Illustrated image cards for the 10 industries.
  - A split image layout for "Why choose us".
  - A ribbon artwork background on the call-to-action.
  - All images are set in Admin → Homepage. A one-time seed marker (`seed.homepage-showcase-v1`) ensures a deleted
    showcase is not re-added.
- Team:
  - The six team members are seeded, with bios written only from the details the company provided.
  - Migration `20261124000000_team_contact` adds experience, phone, WhatsApp, Facebook, Instagram, website and a
    `showContact` switch. Email, phone and WhatsApp reach the public site only when that switch is on.
  - New departments: Security Engineering and Quality Assurance.
  - `/team` shows Leadership first, then everyone else.
  - The admin flow is covered by `tests/e2e/admin-team.spec.ts`.
- The digital marketing service was expanded to full-funnel sales marketing: 14 capabilities and 4 FAQs. This is a
  one-time upgrade, applied only while the original text is unedited.
- Legal: `/privacy` and `/terms` have starter texts (`lib/content/legal.ts`) describing what the site actually
  collects. They replace the placeholders once (seed marker `legal-pages-v1`), are editable in Admin → Pages, and must
  be reviewed by a lawyer.
- A footer "Cookie settings" link (shown when GA is configured) lets visitors change their analytics choice.
- Structured data: Organization `foundingDate` comes from the new `site.foundingYear` setting, and `/team` outputs
  schema.org Person entries (contact details only when the member opted in).
- Stock photography was not added: downloading from Unsplash was blocked in this environment. Real company photos
  are still the biggest remaining upgrade.

### Bengali version (2026-11-24)
- Routing: `app/[lang]`, with English at clean URLs and Bengali under `/bn`. `proxy.ts` rewrites English to `/en/...`
  and redirects `/en/...` to the clean URL. Every page is statically generated per language.
- UI: `lib/i18n/dictionary.ts` holds about 230 strings in English and Bengali. A language switcher sits in the header
  and the mobile menu; it does a full page load, because the two languages are separate route trees. Hind Siliguri
  is loaded only when Bengali glyphs appear, and Bengali text drops letter-spacing.
- Content: `services/public.ts` layers `Translation` rows over cached English, field by field (`lib/i18n/content.ts`).
  `lib/content/bn.ts` seeds 274 translations once (marker `seed.bengali-v1`): settings, menus, every homepage/About
  section, all services/solutions/industries (title, tagline, summary, overview), projects, categories, team and
  general FAQs.
- Admin: a translation panel shows English beside a Bengali input, with "Copy English" and the format help
  (one per line / "Title | Description"). It appears on content edit screens, inside each homepage/About section,
  and in Settings → General, Contact and Footer. Saving clears the cache and revalidates. Permissions follow the
  underlying content.
- Forms reply in the visitor's language, but the service names stored on leads stay in English for the admin.
- SEO: `hreflang` and `x-default` alternates, per-language canonical URLs and OG locale, and a bilingual sitemap.
- Tests: `tests/e2e/i18n.spec.ts` covers rendering, fallback, link prefixes, hreflang, redirects, the switcher, the
  Bengali form messages, the Bengali 404 and saving a translation in the admin.

### Blog launch articles (2026-11-24)
- Six detailed, practical articles are in `lib/content/blog.ts`, seeded once (marker `seed.blog-launch-v1`):
  - ZKTeco attendance integration
  - choosing hotel software
  - practical AI for SMEs
  - cloud vs on-premise in Bangladesh
  - a Facebook/WhatsApp sales funnel
  - a server security checklist
- No invented statistics or client claims. The Hotel Sea Paradise reference describes only the real deployment.
- A new "Digital Marketing" category. Bengali titles and summaries for the posts, and Bengali names for all blog
  categories.
- Covers are original illustrations in `public/images/blog/`, rendered by `scripts/generate-artwork.mjs`. They carry
  an "Illustration" tag and say "Illustration" in their alt text.
- The article bodies are English; their Bengali versions can be added in Admin → Blog → Bengali translation.

### SEO (2026-11-24)
- Keyword titles and descriptions for 19 key pages, seeded once into Admin → SEO (`lib/content/seo.ts`). Bengali
  homepage title from the dictionary.
- Default branded 1200×630 social image. Structured data is one linked graph:
  - Organization, plus ProfessionalService once an address is set
  - WebSite
  - Service (with areaServed and image)
  - BlogPosting (with keywords, section and inLanguage)
  - Person entries linked to the organisation id
- Crawler files: RSS `/feed.xml`, `/llms.txt` (AI search), web manifest, sitemap with images.
- Metadata always sits in the initial `<head>` (`htmlLimitedBots`). Blog and portfolio detail pages are pre-rendered.
- Bing and Facebook verification settings, plus IndexNow pings on publish (optional `INDEXNOW_KEY`).
- Fixed a seed bug: default content (offerings, projects, team) is now created once, so renamed or deleted items are
  never re-created. Removed the duplicate team profile this bug had created.
- Lighthouse SEO is 100 on home, blog, article, contact, portfolio and Bengali pages. `tests/e2e/seo.spec.ts` was
  added. The off-site plan is in `docs/SEO.md`.

## Known gaps / next steps
1. **Redis:** install Redis 7 (production) and set `REDIS_URL`. It's optional locally.
2. **Photography:** upload real team, office and project images; the site currently uses generative brand artwork.
3. **Hotel ERP case study:** add inside-app screenshots (dashboard, reservations, front office) and verified
   results.
4. **Bengali:** the site is bilingual. Still in English (shown on `/bn` until translated in the admin): the detailed
   service/solution/industry sections (features, challenges, process, modules), the project case-study bodies, the
   service FAQs and the legal pages.
5. **Legal pages:** starter texts are published. Have them reviewed by a lawyer, in particular the retention
   period and governing-law clauses.
6. Contact details (email, phone, address) are empty by default. Fill them in Admin → Contact Information.
