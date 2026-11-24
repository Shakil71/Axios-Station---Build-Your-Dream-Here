# Axios Station — Website & CMS

**Build Your Dream Here.** Company website and admin CMS for Axios Station: AI, software engineering,
cloud infrastructure and business automation.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Server Components, Server Actions, `proxy.ts`) |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) |
| UI | Tailwind CSS 4, Framer Motion, Lucide, shadcn-style primitives (Radix) |
| Data | MySQL 8 + Prisma 7 (MariaDB driver adapter) |
| Cache | Redis via ioredis — optional, automatic MySQL fallback |
| Auth | Auth.js v5 credentials, JWT sessions, bcrypt, DB-backed RBAC |
| Validation | Zod 4 |
| Email | Nodemailer (SMTP) |
| Storage | Local disk or S3-compatible |
| Tests | Vitest (unit) + Playwright (e2e) |
| Deploy | Linux + Nginx + PM2 — **no Docker** |

## Quick start (development)

Prerequisites: Node.js ≥ 20.9, MySQL 8 (or MariaDB 10.11+), optionally Redis 7.

```bash
npm install                      # also runs `prisma generate`
cp .env.example .env             # then edit DATABASE_URL, AUTH_SECRET, SEED_ADMIN_*
npx prisma migrate deploy        # creates all tables
npm run db:seed                  # Super Admin + roles + settings + default content
npm run dev                      # http://localhost:3000   admin: /admin
```

`AUTH_SECRET`: `npx auth secret` or `openssl rand -base64 32`.
`SEED_ADMIN_PASSWORD` must be ≥ 12 chars with letters and numbers; remove it from `.env` after seeding.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop / production build / serve |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright (needs a running server; set `E2E_BASE_URL`, and `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` for the CRUD test) |
| `npm run db:migrate` | Create a new migration in development |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Idempotent seed |

## Project structure

```
app/(public)/         Public website (home, about, services, solutions, industries, portfolio, team, blog, contact, CMS pages)
app/admin/            Admin login / password reset
app/admin/(panel)/    Protected CMS (dashboard, content, homepage builder, media, leads, settings, users, roles…)
app/api/              Auth, media upload, CSV export, analytics beacon, health
actions/              Server actions (public forms + admin, all permission-checked)
services/             Data access layer (public read + cache, admin CRUD engine, media, leads)
lib/                  auth, db, redis, security, storage, email, ai, i18n, validation, settings, admin registry, content defaults
components/           ui · layout · sections · admin · seo
prisma/               schema, migrations, seed script (content lives in lib/content/defaults.ts)
scripts/              backups, scheduled publishing, asset tooling
deploy/nginx/         Nginx site + proxy snippet
docs/DEPLOYMENT.md    Production guide & runbooks
tests/                unit + e2e
```

## Architecture notes

* **Admin CMS.** Content modules are declared in `lib/admin/resources.ts`. One generic engine
  (`services/admin/crud.ts`) provides list/search/filter/sort/paginate, create/edit with Zod validation built from
  the field config, publish/unpublish/draft, bulk actions, soft delete, slug uniqueness, activity logging and cache
  invalidation. Adding a module means adding config, not writing new pages.
* **Authorization.** Every admin page calls `requirePagePermission`, every action/API calls `requirePermission`.
  The user and their permissions are reloaded from MySQL on each request, so deactivation, role changes and
  "sign out everywhere" take effect immediately (`sessionVersion`). `proxy.ts` only does an optimistic redirect.
* **Caching.** Public reads go through `cached()` (keys `axs:pub:*`). CMS writes call `invalidateEntity()` plus
  `revalidatePath()`. If Redis is down, reads go straight to MySQL. If MySQL is down, public pages render empty
  states and default navigation instead of crashing.
* **Security.** CSP and security headers, bcrypt (cost 12), login rate limiting, account lockout, login attempt
  logging, timing-safe unknown-user handling, hashed single-use reset tokens, magic-byte upload validation with
  image re-encoding (strips EXIF), filename sanitisation, HTML sanitisation of rich text, honeypot + timing +
  rate-limit spam protection, CSV formula-injection guarding, and same-origin checks on route handlers.
* **AI-ready.** `lib/ai` defines a provider interface with OpenAI and Anthropic adapters, configured by server env
  only. No AI feature is active until one is built on top and the provider is configured.
* **Bilingual (English / বাংলা).** English lives at clean URLs (`/services`), Bengali under `/bn` (`/bn/services`).
  `proxy.ts` rewrites English URLs to the internal `app/[lang]` routes, so both languages are statically generated.
  - UI text: `lib/i18n/dictionary.ts`. Server components call `getT()`; client components call `useT()`.
    Internal links use `LocaleLink`.
  - CMS content: the `Translation` table (entity + id + field + locale). Bengali is layered over English in
    `services/public.ts`, and an empty field falls back to English.
  - Admin: a "Bengali translation" panel on content edit screens, on each homepage/About section and in Settings
    (General, Contact, Footer).
  - SEO: `hreflang` alternates, per-language canonical URLs and a bilingual sitemap.

## Content notes

* No client names, counts, awards or results are invented. Statistics sections stay hidden until an admin adds
  verified figures. Portfolio items can be flagged **Demo**, which shows a visible badge.
* The portfolio is seeded with the **Axios Station Hotel ERP** case study, described only from features visible
  on the live product's sign-in page. Add verified results and screenshots in Admin → Portfolio.
* Photography is not bundled. Upload professional images in Admin → Media Library and attach them to services,
  solutions, projects, team and homepage sections. Until then, the site uses branded generative artwork rather
  than generic stock photos.

See `DEVELOPMENT_PROGRESS.md` for status and `docs/DEPLOYMENT.md` for production.
