/**
 * Development / first-install seed.
 *   npm run db:seed
 * Idempotent: safe to run multiple times (upserts by unique keys).
 * The Super Admin is created from SEED_ADMIN_* env vars — never hardcoded.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, type Prisma } from "../lib/generated/prisma/client";
import { ALL_PERMISSIONS, DEFAULT_ROLES, PERMISSIONS } from "../lib/auth/permissions";
import { hashPassword, passwordPolicyError } from "../lib/security/password";
import { SETTINGS } from "../lib/settings-schema";
import * as data from "../lib/content/defaults";
import * as legal from "../lib/content/legal";
import * as bn from "../lib/content/bn";
import * as blog from "../lib/content/blog";
import { seoDefaults } from "../lib/content/seo";
import { readingMinutes } from "../lib/utils";

const url = new URL(process.env.DATABASE_URL ?? "");
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    allowPublicKeyRetrieval: true,
  }),
});

const json = (v: unknown) => v as Prisma.InputJsonValue;

/**
 * Prisma's driver adapter hides the real MySQL error behind "pool failed to
 * retrieve a connection". Connect once directly so the actual cause is shown.
 */
async function preflight() {
  const mariadb = await import("mariadb");
  try {
    const conn = await mariadb.createConnection({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      allowPublicKeyRetrieval: true,
      connectTimeout: 5000,
    });
    const tables = (await conn.query("SHOW TABLES LIKE 'Permission'")) as unknown[];
    await conn.end();
    if (tables.length === 0) {
      console.error("✖ Database is reachable but has no tables. Run `npx prisma migrate deploy` first.");
      process.exit(1);
    }
  } catch (e) {
    const err = e as { code?: string; sqlMessage?: string; message?: string };
    console.error(`✖ Cannot connect to MySQL: ${err.code ?? ""} ${err.sqlMessage ?? err.message ?? e}`);
    const hints: Record<string, string> = {
      ER_ACCESS_DENIED_ERROR: "The user/password in DATABASE_URL (.env) is wrong, or the MySQL user does not exist yet. Create it (see setup-local-db.sql / README).",
      ER_BAD_DB_ERROR: "The database does not exist. Run: CREATE DATABASE axios_station CHARACTER SET utf8mb4;",
      ER_DBACCESS_DENIED_ERROR: "The user exists but has no privileges on this database. GRANT ALL PRIVILEGES ON axios_station.* TO the user.",
      ECONNREFUSED: "MySQL is not running or not listening on the host/port in DATABASE_URL.",
    };
    if (err.code && hints[err.code]) console.error(`  → ${hints[err.code]}`);
    process.exit(1);
  }
}

async function seedAccess() {
  for (const key of ALL_PERMISSIONS) {
    const p = PERMISSIONS[key];
    await prisma.permission.upsert({
      where: { key },
      update: { description: p.description, group: p.group },
      create: { key, description: p.description, group: p.group },
    });
  }
  const perms = await prisma.permission.findMany();
  const idByKey = new Map(perms.map((p) => [p.key, p.id]));

  for (const [key, def] of Object.entries(DEFAULT_ROLES)) {
    const role = await prisma.role.upsert({
      where: { key },
      update: { name: def.name, description: def.description, isSystem: true },
      create: { key, name: def.name, description: def.description, isSystem: true },
    });
    // Only (re)assign permissions to super_admin on every run; other roles keep admin edits after first seed.
    const existing = await prisma.rolePermission.count({ where: { roleId: role.id } });
    if (key === "super_admin" || existing === 0) {
      await prisma.$transaction([
        prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
        prisma.rolePermission.createMany({
          data: def.permissions.map((pk) => ({ roleId: role.id, permissionId: idByKey.get(pk)! })),
          skipDuplicates: true,
        }),
      ]);
    }
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (!email) {
    console.warn("SEED_ADMIN_EMAIL not set — skipping Super Admin creation.");
    return;
  }
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`Super Admin ${email} already exists — password left unchanged.`);
    return;
  }
  const policy = passwordPolicyError(password);
  if (policy) throw new Error(`SEED_ADMIN_PASSWORD rejected: ${policy}`);
  const superRole = await prisma.role.findUniqueOrThrow({ where: { key: "super_admin" } });
  await prisma.user.create({
    data: {
      email,
      name: process.env.SEED_ADMIN_NAME ?? "Super Admin",
      passwordHash: await hashPassword(password),
      roles: { create: { roleId: superRole.id } },
    },
  });
  console.log(`Created Super Admin ${email}`);
}

async function seedSettings() {
  for (const s of SETTINGS) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: json(s.default), group: s.group, isPublic: s.isPublic ?? true },
    });
  }
}

async function seedNavigation() {
  const header = await prisma.navigation.upsert({ where: { key: "header" }, update: {}, create: { key: "header", name: "Header" } });
  if ((await prisma.navigationItem.count({ where: { navigationId: header.id } })) === 0) {
    for (const [i, item] of data.headerNav.entries()) {
      const parent = await prisma.navigationItem.create({
        data: { navigationId: header.id, label: item.label, href: item.href, sortOrder: i },
      });
      for (const [j, child] of (item.children ?? []).entries()) {
        await prisma.navigationItem.create({
          data: { navigationId: header.id, parentId: parent.id, label: child.label, href: child.href, sortOrder: j },
        });
      }
    }
  }
  for (const nav of data.footerNavs) {
    const n = await prisma.navigation.upsert({ where: { key: nav.key }, update: {}, create: { key: nav.key, name: nav.name } });
    if ((await prisma.navigationItem.count({ where: { navigationId: n.id } })) === 0) {
      await prisma.navigationItem.createMany({
        data: nav.items.map((it, i) => ({ navigationId: n.id, label: it.label, href: it.href, sortOrder: i })),
      });
    }
  }
}

async function seedPages() {
  const pages = [
    { key: "home", slug: "home", title: "Home" },
    { key: "about", slug: "about", title: "About Us" },
    { key: "contact", slug: "contact", title: "Contact" },
    {
      key: "privacy",
      slug: "privacy",
      title: "Privacy Policy",
      body: legal.privacyPolicyHtml,
    },
    {
      key: "terms",
      slug: "terms",
      title: "Terms of Service",
      body: legal.termsHtml,
    },
  ];
  for (const p of pages) {
    await prisma.page.upsert({
      where: { key: p.key },
      update: {},
      create: { key: p.key, slug: p.slug, title: p.title, body: p.body ?? null, status: "PUBLISHED", isSystem: true },
    });
  }
  const home = await prisma.page.findUniqueOrThrow({ where: { key: "home" } });
  if ((await prisma.pageSection.count({ where: { pageId: home.id } })) === 0) {
    await prisma.pageSection.createMany({
      data: data.homepageSections.map((s, i) => ({ ...s, data: s.data ? json(s.data) : undefined, pageId: home.id, sortOrder: i })),
    });
  }
  const about = await prisma.page.findUniqueOrThrow({ where: { key: "about" } });
  if ((await prisma.pageSection.count({ where: { pageId: about.id } })) === 0) {
    await prisma.pageSection.createMany({
      data: data.aboutPage.sections.map((s, i) => ({
        type: s.type,
        title: s.title,
        subtitle: "subtitle" in s ? s.subtitle : undefined,
        description: "description" in s ? s.description : undefined,
        data: "data" in s && s.data ? json(s.data) : undefined,
        pageId: about.id,
        sortOrder: i,
      })),
    });
  }
}

async function seedOfferings() {
  for (const [i, s] of data.services.entries()) {
    const existing = await prisma.service.findUnique({ where: { slug: s.slug } });
    if (existing) continue;
    await prisma.service.create({
      data: {
        slug: s.slug,
        title: s.title,
        icon: s.icon,
        tagline: s.tagline,
        excerpt: s.excerpt,
        overview: s.overview,
        challenges: json(s.challenges),
        solution: s.solution,
        features: json(s.features),
        technologies: json(s.technologies),
        benefits: json(s.benefits),
        process: json(s.process ?? data.processSteps),
        isFeatured: Boolean(s.featured),
        status: "PUBLISHED",
        publishedAt: new Date(),
        sortOrder: i,
        faqs: { create: s.faqs.map((f, j) => ({ question: f.q, answer: f.a, scope: "service", sortOrder: j })) },
      },
    });
  }
  for (const [i, s] of data.solutions.entries()) {
    await prisma.solution.upsert({
      where: { slug: s.slug },
      update: {},
      create: {
        slug: s.slug,
        title: s.title,
        icon: s.icon,
        excerpt: s.excerpt,
        overview: s.overview,
        modules: json(s.modules),
        customization: data.solutionCustomization,
        benefits: json(s.benefits),
        isFeatured: Boolean(s.featured),
        status: "PUBLISHED",
        publishedAt: new Date(),
        sortOrder: i,
      },
    });
  }
  for (const [i, ind] of data.industries.entries()) {
    await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: {},
      create: {
        slug: ind.slug,
        title: ind.title,
        icon: ind.icon,
        excerpt: ind.excerpt,
        challenges: json(ind.challenges),
        approach: json(ind.approach),
        status: "PUBLISHED",
        sortOrder: i,
      },
    });
  }
  for (const [i, c] of data.projectCategories.entries()) {
    await prisma.projectCategory.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, sortOrder: i } });
  }
  for (const [i, c] of data.blogCategories.entries()) {
    await prisma.blogCategory.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, sortOrder: i } });
  }
  // FAQ has no natural unique key, so only insert the defaults once.
  if ((await prisma.fAQ.count({ where: { scope: "general" } })) > 0) return;
  await prisma.fAQ.createMany({
    data: [
      { question: "How do we start a project with Axios Station?", answer: "Book a free consultation. We'll discuss your goals and propose next steps, timeline and budget options.", scope: "general", sortOrder: 0 },
      { question: "Do you work with international clients?", answer: "Yes. We work remotely with clients in different time zones using clear communication routines.", scope: "general", sortOrder: 1 },
      { question: "Do you provide support after launch?", answer: "Yes. We offer maintenance and support plans, and can evolve your system as your business grows.", scope: "general", sortOrder: 2 },
    ],
    skipDuplicates: true,
  }).catch(() => undefined);
}

/** Register a file shipped in /public as a Media row (idempotent). */
function staticMedia(publicUrl: string, altText: string, title: string, width: number, height: number) {
  const storageKey = `static${publicUrl}`;
  return prisma.media.upsert({
    where: { storageKey },
    update: {},
    create: {
      kind: "IMAGE",
      storage: "static",
      storageKey,
      url: publicUrl,
      originalName: publicUrl.split("/").pop()!,
      mimeType: "image/webp",
      sizeBytes: 0,
      width,
      height,
      altText,
      title,
    },
  });
}

async function seedHotelProject() {
  const p = data.hotelErpProject;
  if (await prisma.project.findUnique({ where: { slug: p.slug } })) return;
  const [category, industry, erpService] = await Promise.all([
    prisma.projectCategory.findUnique({ where: { slug: "erp-crm" } }),
    prisma.industry.findUnique({ where: { slug: "hospitality" } }),
    prisma.service.findUnique({ where: { slug: "erp-implementation-development" } }),
  ]);
  const cover = await staticMedia(
    "/images/portfolio/axios-hotel-erp-login.webp",
    "Axios Station Hotel ERP sign-in screen showing Reservations, Front Office, Analytics Dashboard and Security modules",
    "Axios Station Hotel ERP",
    1440,
    1000,
  );
  await prisma.project.create({
    data: {
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      description: p.description,
      challenges: p.challenges,
      solutions: p.solutions,
      results: p.results,
      technologies: json(p.technologies),
      categoryId: category?.id,
      industryId: industry?.id,
      coverImageId: cover.id,
      isDemo: false,
      isFeatured: true,
      status: "PUBLISHED",
      publishedAt: new Date(),
      services: erpService ? { create: { serviceId: erpService.id } } : undefined,
    },
  });
}

async function seedSeaParadiseProject() {
  const p = data.seaParadiseProject;
  if (await prisma.project.findUnique({ where: { slug: p.slug } })) return;
  const [category, industry, services] = await Promise.all([
    prisma.projectCategory.findUnique({ where: { slug: "software-development" } }),
    prisma.industry.findUnique({ where: { slug: "hospitality" } }),
    prisma.service.findMany({
      where: { slug: { in: ["custom-software-development", "system-administration-it-support", "smart-business-automation"] } },
      select: { id: true },
    }),
  ]);
  const cover = await staticMedia("/images/portfolio/sea-paradise-employee-management.webp", p.coverAlt, "Employee management dashboard (illustration)", 1600, 1000);
  const gallery = await Promise.all(p.gallery.map((g) => staticMedia(g.url, g.alt, g.caption, 1600, 1000)));
  await prisma.project.create({
    data: {
      slug: p.slug,
      title: p.title,
      clientName: p.clientName,
      summary: p.summary,
      description: p.description,
      challenges: p.challenges,
      solutions: p.solutions,
      results: p.results,
      technologies: json(p.technologies),
      categoryId: category?.id,
      industryId: industry?.id,
      coverImageId: cover.id,
      isDemo: false,
      isFeatured: true,
      status: "PUBLISHED",
      sortOrder: -1,
      publishedAt: new Date(),
      images: { create: gallery.map((m, i) => ({ mediaId: m.id, caption: p.gallery[i]?.caption, sortOrder: i })) },
      services: services.length ? { create: services.map((sv) => ({ serviceId: sv.id })) } : undefined,
    },
  });
}

/**
 * Fill content added after the first install — only where it is still empty,
 * so anything edited in the admin is never overwritten.
 */
async function backfillContent() {
  const intro = await prisma.pageSection.findFirst({ where: { page: { key: "home" }, type: "intro" } });
  if (intro) {
    const d = (intro.data ?? {}) as { stats?: unknown[] };
    const defaults = data.homepageSections.find((x) => x.type === "intro")?.data as { stats: unknown[] };
    const patch: Prisma.PageSectionUpdateInput = {};
    if (!intro.imageId) {
      const art = await staticMedia(
        "/images/brand/connected-systems.webp",
        "Illustration of Axios Station connecting AI and data, cloud, automation and software",
        "Connected systems (illustration)",
        1600,
        1200,
      );
      patch.image = { connect: { id: art.id } };
    }
    if (!d.stats?.length) patch.data = json({ ...d, stats: defaults.stats });
    if (Object.keys(patch).length) await prisma.pageSection.update({ where: { id: intro.id }, data: patch });
  }
  const ms = await prisma.pageSection.findFirst({ where: { page: { key: "about" }, type: "milestones" } });
  const msData = (ms?.data ?? {}) as { items?: unknown[] };
  if (ms && !msData.items?.length) {
    await prisma.pageSection.update({ where: { id: ms.id }, data: { data: json({ ...msData, items: data.milestones }) } });
  }
  await backfillHomepageArtwork();
  await backfillIndustryCovers();
}

/** Run a one-time content migration; the marker means admin deletions are respected on later runs. */
async function once(marker: string, fn: () => Promise<void>) {
  const key = `seed.${marker}`;
  if (await prisma.siteSetting.findUnique({ where: { key } })) return;
  await fn();
  await prisma.siteSetting.create({ data: { key, value: json(new Date().toISOString()), group: "system", isPublic: false } });
}

async function backfillHomepageArtwork() {
  const home = await prisma.page.findUnique({ where: { key: "home" }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
  if (!home) return;

  // Showcase band right after the intro (fresh installs already have it from the defaults).
  await once("homepage-showcase-v1", async () => {
    if (home.sections.some((x) => x.type === "showcase")) return;
    const def = data.homepageSections.find((x) => x.type === "showcase");
    const intro = home.sections.find((x) => x.type === "intro");
    if (!def) return;
    const at = (intro?.sortOrder ?? 0) + 1;
    await prisma.$transaction([
      prisma.pageSection.updateMany({ where: { pageId: home.id, sortOrder: { gte: at } }, data: { sortOrder: { increment: 1 } } }),
      prisma.pageSection.create({ data: { ...def, data: def.data ? json(def.data) : undefined, pageId: home.id, sortOrder: at } }),
    ]);
  });

  const art: Record<string, () => ReturnType<typeof staticMedia>> = {
    showcase: () =>
      staticMedia(
        "/images/home/showcase-sea-paradise.webp",
        "Illustration of a laptop showing an employee attendance dashboard beside a fingerprint attendance terminal, by the sea at night",
        "Hotel Sea Paradise showcase (illustration)",
        1600,
        1200,
      ),
    why: () =>
      staticMedia(
        "/images/home/why-secure-platform.webp",
        "Illustration of a shield above three layers: your software, data and security, and infrastructure",
        "Secure layered platform (illustration)",
        1200,
        1400,
      ),
    cta: () => staticMedia("/images/home/cta-ribbons.webp", "", "Flowing light ribbons (background)", 2400, 900),
  };
  const sections = await prisma.pageSection.findMany({ where: { pageId: home.id, type: { in: Object.keys(art) }, imageId: null } });
  for (const sec of sections) {
    const media = await art[sec.type]!();
    await prisma.pageSection.update({ where: { id: sec.id }, data: { imageId: media.id } });
  }
}

async function seedTeam() {
  for (const [i, m] of data.teamMembers.entries()) {
    if (await prisma.teamMember.findUnique({ where: { slug: m.slug } })) continue;
    await prisma.teamMember.create({
      data: {
        slug: m.slug,
        name: m.name,
        position: m.position,
        department: m.department,
        experience: m.experience,
        bio: m.bio,
        skills: json(m.skills),
        email: m.email,
        showContact: false,
        status: "PUBLISHED",
        sortOrder: i,
      },
    });
  }
}

/** Upgrade the digital marketing service — only if the admin hasn't edited it since the first install. */
/** Replace the original one-line legal placeholders with the starter texts (never touches edited pages). */
async function upgradeLegalPages() {
  await once("legal-pages-v1", async () => {
    for (const [key, body] of [["privacy", legal.privacyPolicyHtml], ["terms", legal.termsHtml]] as const) {
      await prisma.page.updateMany({ where: { key, body: legal.LEGAL_PLACEHOLDERS[key] }, data: { body } });
    }
  });
  // The original homepage team blurb mentioned designers; the team has none. Fix only if unedited.
  await prisma.pageSection.updateMany({
    where: { type: "team", description: "Engineers, designers and specialists who care about outcomes." },
    data: { description: "Cloud, software, AI, security, QA and marketing specialists who care about outcomes." },
  });
}

/**
 * Bengali versions of the default content (lib/content/bn.ts), seeded once.
 * Existing translations are never overwritten, and a translation an admin
 * cleared is not re-added on later seed runs.
 */
async function seedBengali() {
  await once("bengali-v1", async () => {
    const rows: { entityType: string; entityId: string; field: string; locale: string; value: string }[] = [];
    const add = (entityType: string, entityId: string, field: string, value: string | undefined) => {
      if (value?.trim()) rows.push({ entityType, entityId, field, locale: "bn", value: value.trim() });
    };
    const lines = (v?: string[]) => v?.join("\n");
    const pairs = (v?: [string, string][]) => v?.map(([a, b]) => `${a} | ${b}`).join("\n");

    for (const [key, value] of Object.entries(bn.bnSettings)) add("setting", key, "value", value);

    for (const nav of await prisma.navigation.findMany({ include: { items: true } })) {
      add("navigation", nav.key, "name", bn.bnNavNames[nav.key]);
      for (const item of nav.items) add("navigationItem", item.id, "label", bn.bnNavLabels[item.label]);
    }

    for (const [pageKey, byType] of Object.entries(bn.bnSections)) {
      const page = await prisma.page.findUnique({ where: { key: pageKey }, include: { sections: { orderBy: { sortOrder: "asc" } } } });
      const seen = new Set<string>();
      for (const s of page?.sections ?? []) {
        const tr = byType[s.type];
        if (!tr || seen.has(s.type)) continue;
        seen.add(s.type);
        add("pageSection", s.id, "title", tr.title);
        add("pageSection", s.id, "subtitle", tr.subtitle);
        add("pageSection", s.id, "description", tr.description);
        add("pageSection", s.id, "ctaLabel", tr.ctaLabel);
        add("pageSection", s.id, "cta2Label", tr.cta2Label);
        add("pageSection", s.id, "list", lines(tr.list));
        add("pageSection", s.id, "items", pairs(tr.items));
        add("pageSection", s.id, "stats", pairs(tr.stats));
      }
    }

    for (const s of await prisma.service.findMany({ select: { id: true, slug: true } })) {
      const tr = bn.bnServices[s.slug];
      if (tr) for (const [field, value] of Object.entries(tr)) add("service", s.id, field, value);
    }
    for (const s of await prisma.solution.findMany({ select: { id: true, slug: true } })) {
      const tr = bn.bnSolutions[s.slug];
      if (tr) for (const [field, value] of Object.entries(tr)) add("solution", s.id, field, value);
    }
    for (const s of await prisma.industry.findMany({ select: { id: true, slug: true } })) {
      const tr = bn.bnIndustries[s.slug];
      if (tr) for (const [field, value] of Object.entries(tr)) add("industry", s.id, field, value);
    }
    for (const c of await prisma.projectCategory.findMany({ select: { id: true, slug: true } })) add("projectCategory", c.id, "name", bn.bnCategories[c.slug]);
    for (const p of await prisma.project.findMany({ select: { id: true, slug: true } })) {
      const tr = bn.bnProjects[p.slug];
      if (tr) for (const [field, value] of Object.entries(tr)) add("project", p.id, field, value);
    }
    for (const m of await prisma.teamMember.findMany({ select: { id: true, slug: true } })) {
      const tr = bn.bnTeam[m.slug];
      if (!tr) continue;
      add("teamMember", m.id, "position", tr.position);
      add("teamMember", m.id, "experience", tr.experience);
      add("teamMember", m.id, "bio", tr.bio);
      add("teamMember", m.id, "skills", lines(tr.skills));
    }
    for (const f of await prisma.fAQ.findMany({ where: { scope: "general" }, select: { id: true, question: true } })) {
      const tr = bn.bnFaqs[f.question];
      if (tr) {
        add("faq", f.id, "question", tr.question);
        add("faq", f.id, "answer", tr.answer);
      }
    }

    const { count } = await prisma.translation.createMany({ data: rows, skipDuplicates: true });
    console.log(`Bengali translations: ${count} added.`);
  });
}

/** Bengali names for the blog categories (shown on /bn). */
const BLOG_CATEGORY_BN: Record<string, string> = {
  "artificial-intelligence": "কৃত্রিম বুদ্ধিমত্তা",
  "software-engineering": "সফটওয়্যার ইঞ্জিনিয়ারিং",
  "cloud-devops": "ক্লাউড ও ডেভঅপস",
  "business-automation": "বিজনেস অটোমেশন",
  "company-news": "কোম্পানির খবর",
  "digital-marketing": "ডিজিটাল মার্কেটিং",
};

/**
 * Launch articles (lib/content/blog.ts) with their illustrated covers, tags and
 * Bengali titles/summaries. Seeded once; posts an admin edits or deletes are
 * never touched again.
 */
async function seedBlog() {
  await once("blog-launch-v1", async () => {
    for (const [i, c] of blog.extraBlogCategories.entries()) {
      await prisma.blogCategory.upsert({ where: { slug: c.slug }, update: {}, create: { ...c, sortOrder: 10 + i } });
    }
    const categories = new Map((await prisma.blogCategory.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]));
    const translations: { entityType: string; entityId: string; field: string; locale: string; value: string }[] = [];

    for (const p of blog.launchPosts) {
      if (await prisma.blogPost.findUnique({ where: { slug: p.slug }, select: { id: true } })) continue;
      const cover = await staticMedia(`/images/blog/${p.slug}.webp`, p.coverAlt, `${p.title} (illustration)`, 1600, 900);
      const post = await prisma.blogPost.create({
        data: {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          content: p.content.trim(),
          coverImageId: cover.id,
          categoryId: categories.get(p.category) ?? null,
          readingMinutes: readingMinutes(p.content),
          isFeatured: !!p.featured,
          status: "PUBLISHED",
          publishedAt: new Date(p.publishedAt),
        },
      });
      for (const name of p.tags) {
        const slug = name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const tag = await prisma.blogTag.upsert({ where: { slug }, update: {}, create: { slug, name } });
        await prisma.blogPostTag.create({ data: { postId: post.id, tagId: tag.id } });
      }
      translations.push(
        { entityType: "blogPost", entityId: post.id, field: "title", locale: "bn", value: p.bn.title },
        { entityType: "blogPost", entityId: post.id, field: "excerpt", locale: "bn", value: p.bn.excerpt },
      );
    }
    for (const [slug, name] of Object.entries(BLOG_CATEGORY_BN)) {
      const id = categories.get(slug);
      if (id) translations.push({ entityType: "blogCategory", entityId: id, field: "name", locale: "bn", value: name });
    }
    const { count } = await prisma.translation.createMany({ data: translations, skipDuplicates: true });
    console.log(`Blog: ${blog.launchPosts.length} launch articles checked, ${count} Bengali translations added.`);
  });
}

/** Search-focused titles/descriptions for key pages (Admin → SEO). Seeded once; existing rows are kept. */
async function seedSeo() {
  await once("seo-pages-v1", async () => {
    let added = 0;
    for (const row of seoDefaults) {
      if (await prisma.sEO.findUnique({ where: { path: row.path }, select: { id: true } })) continue;
      await prisma.sEO.create({ data: row });
      added++;
    }
    console.log(`SEO: ${added} page entries added.`);
  });
}

async function upgradeDigitalMarketing() {
  await once("digital-marketing-v2", async () => {
    const def = data.services.find((x) => x.slug === "digital-marketing-business-growth");
    const svc = await prisma.service.findUnique({ where: { slug: "digital-marketing-business-growth" } });
    const ORIGINAL = "We combine technical SEO, content and performance marketing with analytics so every campaign can be measured.";
    if (!def || !svc || svc.overview !== ORIGINAL) return;
    await prisma.$transaction([
      prisma.service.update({
        where: { id: svc.id },
        data: {
          tagline: def.tagline,
          excerpt: def.excerpt,
          overview: def.overview,
          challenges: json(def.challenges),
          solution: def.solution,
          features: json(def.features),
          technologies: json(def.technologies),
          benefits: json(def.benefits),
        },
      }),
      prisma.fAQ.deleteMany({ where: { serviceId: svc.id } }),
      prisma.fAQ.createMany({
        data: def.faqs.map((f, j) => ({ question: f.q, answer: f.a, scope: "service", serviceId: svc.id, sortOrder: j })),
      }),
    ]);
  });
}

async function backfillIndustryCovers() {
  const industries = await prisma.industry.findMany({ where: { coverImageId: null }, select: { id: true, slug: true, title: true } });
  for (const ind of industries) {
    const url = `/images/industries/${ind.slug}.webp`;
    try {
      await fs.access(path.join(process.cwd(), "public", url));
    } catch {
      continue; // no artwork for custom industries
    }
    const media = await staticMedia(url, `Illustration for the ${ind.title} industry`, `${ind.title} (illustration)`, 1200, 900);
    await prisma.industry.update({ where: { id: ind.id }, data: { coverImageId: media.id } });
  }
}

async function main() {
  await preflight();
  await seedAccess();
  await seedSettings();
  await seedNavigation();
  await seedPages();
  // Default content is created once. Later runs never re-create items an admin renamed or deleted.
  await once("offerings-v1", seedOfferings);
  await once("project-hotel-erp-v1", seedHotelProject);
  await once("project-sea-paradise-v1", seedSeaParadiseProject);
  await backfillContent();
  await once("team-v1", seedTeam);
  await upgradeDigitalMarketing();
  await upgradeLegalPages();
  await seedBengali();
  await seedBlog();
  await seedSeo();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
