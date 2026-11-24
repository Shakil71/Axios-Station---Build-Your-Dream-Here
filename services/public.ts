import "server-only";
import { prisma, safeQuery } from "@/lib/db/prisma";
import { cached } from "@/lib/redis/cache";
import { cacheKeys } from "@/lib/redis/keys";
import { defaultSettings, type SettingsMap } from "@/lib/settings-schema";
import { asStringArray, asTitledItems, type TitledItem } from "@/lib/utils";
import type { Prisma } from "@/lib/generated/prisma/client";
import { footerNavs, headerNav } from "@/lib/content/defaults";
import { getLocale } from "@/lib/i18n/server";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { localizeAll, localizeOne, overlay, translationMap, translatedValue } from "@/lib/i18n/content";
import { TRANSLATABLE_SETTINGS } from "@/lib/i18n/translatable";

/*
 * Public read layer. Every function:
 *   – returns only PUBLISHED, non-deleted content
 *   – is language-aware: English is loaded and cached, then translations for the
 *     current request's locale (lib/i18n/server.ts) are layered on top
 *   – returns plain serialisable objects (safe to cache as JSON)
 *   – goes through Redis (if available) and degrades gracefully if MySQL is down
 */

export type MediaDTO = { url: string; alt: string; width: number | null; height: number | null } | null;
const mediaSelect = { select: { url: true, altText: true, width: true, height: true } } as const;
function toMedia(m: { url: string; altText: string | null; width: number | null; height: number | null } | null | undefined): MediaDTO {
  return m ? { url: m.url, alt: m.altText ?? "", width: m.width, height: m.height } : null;
}
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

const live = { status: "PUBLISHED" as const, deletedAt: null };

// ── Settings & navigation ───────────────────────────────────

async function getSettingsBase(): Promise<SettingsMap> {
  return cached(cacheKeys.settings(), async () => {
    const rows = await safeQuery(() => prisma.siteSetting.findMany({ where: { isPublic: true } }), [], "settings");
    const map = defaultSettings();
    for (const r of rows) map[r.key] = r.value as SettingsMap[string];
    return map;
  });
}

export type NavItemDTO = { id: string; label: string; href: string; isExternal: boolean; children: NavItemDTO[] };

async function getNavigationBase(key: string): Promise<{ name: string; items: NavItemDTO[] }> {
  return cached(cacheKeys.navigation(key), async () => {
    const nav = await safeQuery(
      () =>
        prisma.navigation.findUnique({
          where: { key },
          include: { items: { where: { isEnabled: true }, orderBy: { sortOrder: "asc" } } },
        }),
      null,
      `nav:${key}`,
    );
    if (!nav) return fallbackNavigation(key);
    const build = (parentId: string | null): NavItemDTO[] =>
      nav.items
        .filter((i) => i.parentId === parentId)
        .map((i) => ({ id: i.id, label: i.label, href: i.href, isExternal: i.isExternal, children: build(i.id) }));
    return { name: nav.name, items: build(null) };
  });
}

/** Default menus, used only when the navigation record doesn't exist (fresh install / DB unreachable). */
function fallbackNavigation(key: string): { name: string; items: NavItemDTO[] } {
  const mk = (label: string, href: string, i: string, children: NavItemDTO[] = []): NavItemDTO => ({ id: `fb-${i}`, label, href, isExternal: false, children });
  if (key === "header") {
    return {
      name: "Header",
      items: headerNav.map((it, i) => mk(it.label, it.href, `h${i}`, (it.children ?? []).map((c, j) => mk(c.label, c.href, `h${i}-${j}`)))),
    };
  }
  const f = footerNavs.find((n) => n.key === key);
  return f ? { name: f.name, items: f.items.map((it, i) => mk(it.label, it.href, `${key}-${i}`)) } : { name: "", items: [] };
}

// ── Pages & sections ────────────────────────────────────────

export type SectionDTO = {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  cta2Label: string | null;
  cta2Href: string | null;
  image: MediaDTO;
  items: TitledItem[];
  list: string[];
  stats: { value: string; label: string }[];
  limit: number;
};

function toSection(s: Prisma.PageSectionGetPayload<{ include: { image: typeof mediaSelect } }>): SectionDTO {
  const d = (s.data ?? {}) as Record<string, unknown>;
  const stats = Array.isArray(d.stats)
    ? (d.stats as Record<string, unknown>[])
        .map((x) => ({ value: String(x?.value ?? ""), label: String(x?.label ?? "") }))
        .filter((x) => x.value && x.label)
    : [];
  return {
    id: s.id,
    type: s.type,
    title: s.title,
    subtitle: s.subtitle,
    description: s.description,
    ctaLabel: s.ctaLabel,
    ctaHref: s.ctaHref,
    cta2Label: s.cta2Label,
    cta2Href: s.cta2Href,
    image: toMedia(s.image),
    items: asTitledItems(d.items),
    list: asStringArray(d.list),
    stats,
    limit: typeof d.limit === "number" ? d.limit : 6,
  };
}

export type PageDTO = { id: string; key: string; slug: string; title: string; summary: string | null; body: string | null; updatedAt: string; sections: SectionDTO[] };

async function getPageBase(key: string): Promise<PageDTO | null> {
  return cached(cacheKeys.page(key), async () => {
    const page = await safeQuery(
      () =>
        prisma.page.findFirst({
          where: { key, ...live },
          include: { sections: { where: { isEnabled: true }, orderBy: { sortOrder: "asc" }, include: { image: mediaSelect } } },
        }),
      null,
      `page:${key}`,
    );
    if (!page) return null;
    return {
      id: page.id,
      key: page.key,
      slug: page.slug,
      title: page.title,
      summary: page.summary,
      body: page.body,
      updatedAt: page.updatedAt.toISOString(),
      sections: page.sections.map(toSection),
    };
  });
}

export async function getPageBySlug(slug: string): Promise<PageDTO | null> {
  const page = await safeQuery(() => prisma.page.findFirst({ where: { slug, ...live }, select: { key: true } }), null, "page-slug");
  return page ? getPage(page.key) : null;
}

export async function listCustomPageSlugs(): Promise<string[]> {
  const rows = await safeQuery(() => prisma.page.findMany({ where: { ...live, isSystem: false }, select: { slug: true } }), [], "pages");
  return rows.map((r) => r.slug);
}

// ── Services ────────────────────────────────────────────────

export type ServiceCardDTO = { id: string; slug: string; title: string; excerpt: string; icon: string | null; tagline: string | null; isFeatured: boolean; cover: MediaDTO };

async function listServicesBase(): Promise<ServiceCardDTO[]> {
  return cached(cacheKeys.services(), async () => {
    const rows = await safeQuery(
      () => prisma.service.findMany({ where: live, orderBy: [{ sortOrder: "asc" }, { title: "asc" }], include: { coverImage: mediaSelect } }),
      [],
      "services",
    );
    return rows.map((s) => ({ id: s.id, slug: s.slug, title: s.title, excerpt: s.excerpt, icon: s.icon, tagline: s.tagline, isFeatured: s.isFeatured, cover: toMedia(s.coverImage) }));
  });
}

async function getServiceBase(slug: string) {
  return cached(cacheKeys.service(slug), async () => {
    const s = await safeQuery(
      () =>
        prisma.service.findFirst({
          where: { slug, ...live },
          include: {
            coverImage: mediaSelect,
            faqs: { where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } },
            projects: {
              where: { project: { ...live } },
              include: { project: { include: { coverImage: mediaSelect, category: true } } },
              take: 3,
            },
          },
        }),
      null,
      `service:${slug}`,
    );
    if (!s) return null;
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      tagline: s.tagline,
      excerpt: s.excerpt,
      icon: s.icon,
      overview: s.overview,
      challenges: asStringArray(s.challenges),
      solution: s.solution,
      features: asTitledItems(s.features),
      technologies: asStringArray(s.technologies),
      benefits: asStringArray(s.benefits),
      process: asTitledItems(s.process),
      cover: toMedia(s.coverImage),
      updatedAt: s.updatedAt.toISOString(),
      faqs: s.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
      projects: s.projects.map(({ project: p }) => toProjectCard(p)),
    };
  });
}

// ── Solutions ───────────────────────────────────────────────

export type SolutionCardDTO = { id: string; slug: string; title: string; excerpt: string; icon: string | null; isFeatured: boolean; cover: MediaDTO };

async function listSolutionsBase(): Promise<SolutionCardDTO[]> {
  return cached(cacheKeys.solutions(), async () => {
    const rows = await safeQuery(
      () => prisma.solution.findMany({ where: live, orderBy: [{ sortOrder: "asc" }, { title: "asc" }], include: { coverImage: mediaSelect } }),
      [],
      "solutions",
    );
    return rows.map((s) => ({ id: s.id, slug: s.slug, title: s.title, excerpt: s.excerpt, icon: s.icon, isFeatured: s.isFeatured, cover: toMedia(s.coverImage) }));
  });
}

async function getSolutionBase(slug: string) {
  return cached(cacheKeys.solution(slug), async () => {
    const s = await safeQuery(
      () =>
        prisma.solution.findFirst({
          where: { slug, ...live },
          include: { coverImage: mediaSelect, faqs: { where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } } },
        }),
      null,
      `solution:${slug}`,
    );
    if (!s) return null;
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      tagline: s.tagline,
      excerpt: s.excerpt,
      icon: s.icon,
      overview: s.overview,
      modules: asTitledItems(s.modules),
      customization: s.customization,
      benefits: asStringArray(s.benefits),
      technologies: asStringArray(s.technologies),
      cover: toMedia(s.coverImage),
      updatedAt: s.updatedAt.toISOString(),
      faqs: s.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
    };
  });
}

// ── Industries ──────────────────────────────────────────────

export type IndustryCardDTO = { id: string; slug: string; title: string; excerpt: string; icon: string | null; cover: MediaDTO };

async function listIndustriesBase(): Promise<IndustryCardDTO[]> {
  return cached(cacheKeys.industries(), async () => {
    const rows = await safeQuery(
      () => prisma.industry.findMany({ where: live, orderBy: [{ sortOrder: "asc" }, { title: "asc" }], include: { coverImage: mediaSelect } }),
      [],
      "industries",
    );
    return rows.map((s) => ({ id: s.id, slug: s.slug, title: s.title, excerpt: s.excerpt, icon: s.icon, cover: toMedia(s.coverImage) }));
  });
}

async function getIndustryBase(slug: string) {
  return cached(cacheKeys.industry(slug), async () => {
    const s = await safeQuery(
      () =>
        prisma.industry.findFirst({
          where: { slug, ...live },
          include: {
            coverImage: mediaSelect,
            projects: { where: live, include: { coverImage: mediaSelect, category: true }, take: 3, orderBy: { sortOrder: "asc" } },
          },
        }),
      null,
      `industry:${slug}`,
    );
    if (!s) return null;
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      excerpt: s.excerpt,
      icon: s.icon,
      overview: s.overview,
      challenges: asStringArray(s.challenges),
      approach: asTitledItems(s.approach),
      cover: toMedia(s.coverImage),
      updatedAt: s.updatedAt.toISOString(),
      projects: s.projects.map(toProjectCard),
    };
  });
}

// ── Portfolio ───────────────────────────────────────────────

export type ProjectCardDTO = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: { id: string; slug: string; name: string } | null;
  technologies: string[];
  cover: MediaDTO;
  isDemo: boolean;
  isFeatured: boolean;
};

function toProjectCard(
  p: Prisma.ProjectGetPayload<{ include: { coverImage: typeof mediaSelect; category: true } }>,
): ProjectCardDTO {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    category: p.category ? { id: p.category.id, slug: p.category.slug, name: p.category.name } : null,
    technologies: asStringArray(p.technologies),
    cover: toMedia(p.coverImage),
    isDemo: p.isDemo,
    isFeatured: p.isFeatured,
  };
}

async function listProjectCategoriesBase() {
  return cached(cacheKeys.projectCategories(), () =>
    safeQuery(() => prisma.projectCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, name: true } }), [], "project-categories"),
  );
}

async function listProjectsBase(opts: { category?: string; q?: string; featured?: boolean; page?: number; perPage?: number } = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(48, opts.perPage ?? 12);
  const q = opts.q?.trim().slice(0, 100) ?? "";
  const key = cacheKeys.projects(JSON.stringify({ c: opts.category ?? "", q, f: !!opts.featured, page, perPage }));
  return cached(key, async () => {
    const where: Prisma.ProjectWhereInput = {
      ...live,
      ...(opts.category ? { category: { slug: opts.category } } : {}),
      ...(opts.featured ? { isFeatured: true } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { summary: { contains: q } }] } : {}),
    };
    const [rows, total] = await safeQuery(
      () =>
        Promise.all([
          prisma.project.findMany({
            where,
            orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }],
            include: { coverImage: mediaSelect, category: true },
            skip: (page - 1) * perPage,
            take: perPage,
          }),
          prisma.project.count({ where }),
        ]),
      [[], 0] as [never[], number],
      "projects",
    );
    return { items: rows.map(toProjectCard), total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
  });
}

async function getProjectBase(slug: string) {
  return cached(cacheKeys.project(slug), async () => {
    const p = await safeQuery(
      () =>
        prisma.project.findFirst({
          where: { slug, ...live },
          include: {
            coverImage: mediaSelect,
            category: true,
            industry: true,
            images: { orderBy: { sortOrder: "asc" }, include: { media: mediaSelect } },
          },
        }),
      null,
      `project:${slug}`,
    );
    if (!p) return null;
    return {
      ...toProjectCard(p),
      description: p.description,
      clientName: p.clientName,
      industry: p.industry && p.industry.status === "PUBLISHED" ? { id: p.industry.id, slug: p.industry.slug, title: p.industry.title } : null,
      challenges: p.challenges,
      solutions: p.solutions,
      results: p.results,
      projectUrl: p.projectUrl,
      publishedAt: iso(p.publishedAt),
      updatedAt: p.updatedAt.toISOString(),
      gallery: p.images.map((i) => ({ ...toMedia(i.media)!, caption: i.caption })),
    };
  });
}

// ── Team, testimonials, FAQs ────────────────────────────────

async function listTeamBase() {
  return cached(cacheKeys.team(), async () => {
    const rows = await safeQuery(
      () => prisma.teamMember.findMany({ where: live, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { photo: mediaSelect } }),
      [],
      "team",
    );
    return rows.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      position: m.position,
      department: m.department,
      bio: m.bio,
      skills: asStringArray(m.skills),
      photo: toMedia(m.photo),
      experience: m.experience,
      linkedinUrl: m.linkedinUrl,
      githubUrl: m.githubUrl,
      twitterUrl: m.twitterUrl,
      facebookUrl: m.facebookUrl,
      instagramUrl: m.instagramUrl,
      websiteUrl: m.websiteUrl,
      // Private contact details never leave the server unless the admin opted in.
      email: m.showContact ? m.email : null,
      phone: m.showContact ? m.phone : null,
      whatsapp: m.showContact ? m.whatsapp : null,
    }));
  });
}

async function listTestimonialsBase() {
  return cached(cacheKeys.testimonials(), async () => {
    const rows = await safeQuery(
      () => prisma.testimonial.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" }, include: { avatar: mediaSelect } }),
      [],
      "testimonials",
    );
    return rows.map((t) => ({
      id: t.id,
      authorName: t.authorName,
      authorTitle: t.authorTitle,
      company: t.company,
      quote: t.quote,
      rating: t.rating,
      avatar: toMedia(t.avatar),
    }));
  });
}

async function listGeneralFaqsBase() {
  return cached(cacheKeys.faqs("general"), async () => {
    const rows = await safeQuery(
      () => prisma.fAQ.findMany({ where: { scope: "general", status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } }),
      [],
      "faqs",
    );
    return rows.map((f) => ({ id: f.id, question: f.question, answer: f.answer }));
  });
}

// ── Blog ────────────────────────────────────────────────────

/** A post is visible when published, or scheduled and its time has come. */
function visiblePostWhere(now = new Date()): Prisma.BlogPostWhereInput {
  return {
    deletedAt: null,
    OR: [
      { status: "PUBLISHED", OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
      { status: "SCHEDULED", scheduledFor: { lte: now } },
    ],
  };
}

export type PostCardDTO = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover: MediaDTO;
  category: { id: string; slug: string; name: string } | null;
  author: string | null;
  readingMinutes: number;
  publishedAt: string | null;
  isFeatured: boolean;
};

const postCardInclude = { coverImage: mediaSelect, category: true, author: { select: { name: true } } } as const;

function toPostCard(p: Prisma.BlogPostGetPayload<{ include: typeof postCardInclude }>): PostCardDTO {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    cover: toMedia(p.coverImage),
    category: p.category ? { id: p.category.id, slug: p.category.slug, name: p.category.name } : null,
    author: p.author?.name ?? null,
    readingMinutes: p.readingMinutes,
    publishedAt: iso(p.publishedAt ?? p.scheduledFor),
    isFeatured: p.isFeatured,
  };
}

async function listPostsBase(opts: { category?: string; tag?: string; q?: string; page?: number; perPage?: number; featured?: boolean } = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(48, opts.perPage ?? 9);
  const q = opts.q?.trim().slice(0, 100) ?? "";
  const key = cacheKeys.blogList(JSON.stringify({ c: opts.category ?? "", t: opts.tag ?? "", q, page, perPage, f: !!opts.featured }));
  return cached(
    key,
    async () => {
      const where: Prisma.BlogPostWhereInput = {
        AND: [
          visiblePostWhere(),
          opts.category ? { category: { slug: opts.category } } : {},
          opts.tag ? { tags: { some: { tag: { slug: opts.tag } } } } : {},
          opts.featured ? { isFeatured: true } : {},
          q ? { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] } : {},
        ],
      };
      const [rows, total] = await safeQuery(
        () =>
          Promise.all([
            prisma.blogPost.findMany({
              where,
              orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
              include: postCardInclude,
              skip: (page - 1) * perPage,
              take: perPage,
            }),
            prisma.blogPost.count({ where }),
          ]),
        [[], 0] as [never[], number],
        "posts",
      );
      return { items: rows.map(toPostCard), total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
    },
    120,
  );
}

async function listBlogCategoriesBase() {
  return cached(cacheKeys.blogCategories(), () =>
    safeQuery(() => prisma.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, name: true } }), [], "blog-categories"),
  );
}

async function getPostBase(slug: string) {
  return cached(
    cacheKeys.blogPost(slug),
    async () => {
      const p = await safeQuery(
        () =>
          prisma.blogPost.findFirst({
            where: { AND: [{ slug }, visiblePostWhere()] },
            include: { ...postCardInclude, tags: { include: { tag: true } } },
          }),
        null,
        `post:${slug}`,
      );
      if (!p) return null;
      const related = await safeQuery(
        () =>
          prisma.blogPost.findMany({
            where: {
              AND: [
                visiblePostWhere(),
                { id: { not: p.id } },
                p.categoryId ? { categoryId: p.categoryId } : {},
              ],
            },
            include: postCardInclude,
            orderBy: { publishedAt: "desc" },
            take: 3,
          }),
        [],
        "related-posts",
      );
      return {
        ...toPostCard(p),
        content: p.content,
        updatedAt: p.updatedAt.toISOString(),
        tags: p.tags.map((t) => ({ slug: t.tag.slug, name: t.tag.name })),
        related: related.map(toPostCard),
      };
    },
    120,
  );
}

// ── SEO ─────────────────────────────────────────────────────

export type SeoDTO = {
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  noIndex: boolean;
} | null;

export async function getSeo(path: string): Promise<SeoDTO> {
  return cached(cacheKeys.seo(path), async () => {
    const s = await safeQuery(() => prisma.sEO.findUnique({ where: { path } }), null, "seo");
    return s
      ? { metaTitle: s.metaTitle, metaDescription: s.metaDescription, keywords: s.keywords, canonicalUrl: s.canonicalUrl, ogImageUrl: s.ogImageUrl, noIndex: s.noIndex }
      : null;
  });
}

// ── Sitemap ─────────────────────────────────────────────────

export async function sitemapEntries() {
  return safeQuery(
    async () => {
      const [services, solutions, industries, projects, posts, pages] = await Promise.all([
        prisma.service.findMany({ where: live, select: { slug: true, updatedAt: true, coverImage: { select: { url: true } } } }),
        prisma.solution.findMany({ where: live, select: { slug: true, updatedAt: true, coverImage: { select: { url: true } } } }),
        prisma.industry.findMany({ where: live, select: { slug: true, updatedAt: true, coverImage: { select: { url: true } } } }),
        prisma.project.findMany({ where: live, select: { slug: true, updatedAt: true, coverImage: { select: { url: true } } } }),
        prisma.blogPost.findMany({ where: visiblePostWhere(), select: { slug: true, updatedAt: true, coverImage: { select: { url: true } } } }),
        prisma.page.findMany({ where: { ...live, isSystem: false }, select: { slug: true, updatedAt: true } }),
      ]);
      return { services, solutions, industries, projects, posts, pages };
    },
    { services: [], solutions: [], industries: [], projects: [], posts: [], pages: [] },
    "sitemap",
  );
}

// ── Localised API ───────────────────────────────────────────
// Each export defaults to the current request's locale; pass `lang` to override.

const isDefault = (lang: Locale) => lang === defaultLocale;

async function localizeProjectCards<T extends ProjectCardDTO>(cards: T[], lang: Locale): Promise<T[]> {
  if (isDefault(lang) || !cards.length) return cards;
  const [pm, cm] = await Promise.all([translationMap("project", lang), translationMap("projectCategory", lang)]);
  return cards.map((c) => {
    const o = overlay("project", c.id, c, pm);
    return o.category ? { ...o, category: overlay("projectCategory", o.category.id, o.category, cm) } : o;
  });
}

async function localizePostCards<T extends PostCardDTO>(cards: T[], lang: Locale): Promise<T[]> {
  if (isDefault(lang) || !cards.length) return cards;
  const [pm, cm] = await Promise.all([translationMap("blogPost", lang), translationMap("blogCategory", lang)]);
  return cards.map((c) => {
    const o = overlay("blogPost", c.id, c, pm);
    return o.category ? { ...o, category: overlay("blogCategory", o.category.id, o.category, cm) } : o;
  });
}

export async function getSettings(lang: Locale = getLocale()): Promise<SettingsMap> {
  const base = await getSettingsBase();
  if (isDefault(lang)) return base;
  const map = await translationMap("setting", lang);
  const out = { ...base };
  for (const key of TRANSLATABLE_SETTINGS) {
    const v = overlay("setting", key, { value: base[key] }, map).value;
    if (typeof v === "string") out[key] = v;
  }
  return out;
}

export async function getNavigation(key: string, lang: Locale = getLocale()): Promise<{ name: string; items: NavItemDTO[] }> {
  const nav = await getNavigationBase(key);
  if (isDefault(lang)) return nav;
  const map = await translationMap("navigationItem", lang);
  const walk = (items: NavItemDTO[]): NavItemDTO[] => items.map((i) => ({ ...overlay("navigationItem", i.id, i, map), children: walk(i.children) }));
  return { name: await translatedValue("navigation", key, "name", lang, nav.name), items: walk(nav.items) };
}

export async function getPage(key: string, lang: Locale = getLocale()): Promise<PageDTO | null> {
  const page = await getPageBase(key);
  if (!page || isDefault(lang)) return page;
  const [p, sections] = await Promise.all([localizeOne("page", page, lang), localizeAll("pageSection", page.sections, lang)]);
  return { ...p, sections };
}

export async function listServices(lang: Locale = getLocale()): Promise<ServiceCardDTO[]> {
  return localizeAll("service", await listServicesBase(), lang);
}

export async function getService(slug: string, lang: Locale = getLocale()) {
  const s = await getServiceBase(slug);
  if (!s || isDefault(lang)) return s;
  const [o, faqs, projects] = await Promise.all([localizeOne("service", s, lang), localizeAll("faq", s.faqs, lang), localizeProjectCards(s.projects, lang)]);
  return { ...o, faqs, projects };
}

export async function listSolutions(lang: Locale = getLocale()): Promise<SolutionCardDTO[]> {
  return localizeAll("solution", await listSolutionsBase(), lang);
}

export async function getSolution(slug: string, lang: Locale = getLocale()) {
  const s = await getSolutionBase(slug);
  if (!s || isDefault(lang)) return s;
  const [o, faqs] = await Promise.all([localizeOne("solution", s, lang), localizeAll("faq", s.faqs, lang)]);
  return { ...o, faqs };
}

export async function listIndustries(lang: Locale = getLocale()): Promise<IndustryCardDTO[]> {
  return localizeAll("industry", await listIndustriesBase(), lang);
}

export async function getIndustry(slug: string, lang: Locale = getLocale()) {
  const s = await getIndustryBase(slug);
  if (!s || isDefault(lang)) return s;
  const [o, projects] = await Promise.all([localizeOne("industry", s, lang), localizeProjectCards(s.projects, lang)]);
  return { ...o, projects };
}

export async function listProjectCategories(lang: Locale = getLocale()) {
  return localizeAll("projectCategory", await listProjectCategoriesBase(), lang);
}

export async function listProjects(opts: Parameters<typeof listProjectsBase>[0] = {}, lang: Locale = getLocale()) {
  const r = await listProjectsBase(opts);
  return { ...r, items: await localizeProjectCards(r.items, lang) };
}

export async function getProject(slug: string, lang: Locale = getLocale()) {
  const p = await getProjectBase(slug);
  if (!p || isDefault(lang)) return p;
  const [card] = await localizeProjectCards([p], lang);
  const industry = p.industry ? await localizeOne("industry", p.industry, lang) : null;
  return { ...card!, industry };
}

export async function listTeam(lang: Locale = getLocale()) {
  return localizeAll("teamMember", await listTeamBase(), lang);
}

export async function listTestimonials(lang: Locale = getLocale()) {
  return localizeAll("testimonial", await listTestimonialsBase(), lang);
}

export async function listGeneralFaqs(lang: Locale = getLocale()) {
  return localizeAll("faq", await listGeneralFaqsBase(), lang);
}

export async function listPosts(opts: Parameters<typeof listPostsBase>[0] = {}, lang: Locale = getLocale()) {
  const r = await listPostsBase(opts);
  return { ...r, items: await localizePostCards(r.items, lang) };
}

export async function listBlogCategories(lang: Locale = getLocale()) {
  return localizeAll("blogCategory", await listBlogCategoriesBase(), lang);
}

export async function getPost(slug: string, lang: Locale = getLocale()) {
  const p = await getPostBase(slug);
  if (!p || isDefault(lang)) return p;
  const [[card], related] = await Promise.all([localizePostCards([p], lang), localizePostCards(p.related, lang)]);
  return { ...card!, related };
}
