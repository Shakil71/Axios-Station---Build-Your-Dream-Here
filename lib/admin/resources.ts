/**
 * Admin resource registry (pure data — safe for client and server).
 *
 * Each entry declares how a Prisma model is listed, searched, edited,
 * validated, authorised and which public cache it invalidates. The generic
 * CRUD engine (services/admin/crud.ts) and UI (components/admin/*) are driven
 * entirely by this file, so adding a module is a config change, not new code.
 */
import type { Permission } from "@/lib/auth/permissions";

export type FieldType =
  | "text" | "textarea" | "richtext" | "slug" | "url" | "email" | "number" | "boolean"
  | "select" | "status" | "datetime" | "icon" | "relation" | "media" | "list" | "items"
  | "tags" | "relationMany" | "gallery";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** relation / relationMany: Prisma model + label column */
  relation?: { model: string; labelField: string; where?: Record<string, unknown> };
  /** slug: source field to auto-generate from */
  from?: string;
  max?: number;
  min?: number;
  colSpan?: 1 | 2;
  section?: string;
};

export type Column = { name: string; label: string; type?: "text" | "status" | "boolean" | "date" | "relation" | "number" | "badge"; relationField?: string; sortable?: boolean };

export type Resource = {
  key: string;
  model: string;
  label: string;
  singular: string;
  description: string;
  permission: Permission;
  publishPermission?: Permission;
  titleField: string;
  fields: Field[];
  columns: Column[];
  searchFields: string[];
  defaultSort: { field: string; dir: "asc" | "desc" };
  hasStatus?: boolean;
  softDelete?: boolean;
  hasSortOrder?: boolean;
  cacheEntity: string;
  /** Public URL for preview links; {slug} is replaced. */
  publicPath?: string;
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
  include?: Record<string, unknown>;
};

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];
const BLOG_STATUS = [...STATUS_OPTIONS.slice(0, 2), { value: "SCHEDULED", label: "Scheduled" }, STATUS_OPTIONS[2]!];

const statusFilter = { name: "status", label: "Status", options: STATUS_OPTIONS };
const seoHelp = "SEO title/description for this page are managed under SEO → by URL path.";

const offeringBase = (singular: string): Field[] => [
  { name: "title", label: "Title", type: "text", required: true, max: 191 },
  { name: "slug", label: "Slug", type: "slug", from: "title", required: true, help: "URL segment. Lowercase letters, numbers and dashes." },
  { name: "excerpt", label: "Short description", type: "textarea", required: true, max: 600, colSpan: 2 },
  { name: "icon", label: "Icon", type: "icon" },
  { name: "coverImageId", label: "Cover image", type: "media" },
  { name: "overview", label: `${singular} overview`, type: "textarea", colSpan: 2, section: "Content" },
];

const publishing: Field[] = [
  { name: "status", label: "Status", type: "status", options: STATUS_OPTIONS, required: true, section: "Publishing" },
  { name: "sortOrder", label: "Display order", type: "number", section: "Publishing" },
];

export const RESOURCES: Record<string, Resource> = {
  services: {
    key: "services",
    model: "service",
    label: "Services",
    singular: "Service",
    description: "Service pages shown under /services. " + seoHelp,
    permission: "services.manage",
    titleField: "title",
    fields: [
      ...offeringBase("Service"),
      { name: "tagline", label: "Tagline", type: "text", max: 255, colSpan: 2 },
      { name: "challenges", label: "Business challenges", type: "list", help: "One per line.", section: "Content" },
      { name: "solution", label: "Our solution", type: "textarea", section: "Content" },
      { name: "features", label: "Key features", type: "items", help: "One per line: Title | Description", colSpan: 2, section: "Content" },
      { name: "technologies", label: "Technologies", type: "list", help: "One per line.", section: "Content" },
      { name: "benefits", label: "Business benefits", type: "list", help: "One per line.", section: "Content" },
      { name: "process", label: "Development process", type: "items", help: "One per line: Step | Description", colSpan: 2, section: "Content" },
      { name: "isFeatured", label: "Featured on homepage", type: "boolean", section: "Publishing" },
      ...publishing,
    ],
    columns: [
      { name: "title", label: "Title", sortable: true },
      { name: "status", label: "Status", type: "status", sortable: true },
      { name: "isFeatured", label: "Featured", type: "boolean" },
      { name: "sortOrder", label: "Order", type: "number", sortable: true },
      { name: "updatedAt", label: "Updated", type: "date", sortable: true },
    ],
    searchFields: ["title", "excerpt", "slug"],
    defaultSort: { field: "sortOrder", dir: "asc" },
    hasStatus: true,
    softDelete: true,
    hasSortOrder: true,
    cacheEntity: "service",
    publicPath: "/services/{slug}",
    filters: [statusFilter],
  },
  solutions: {
    key: "solutions",
    model: "solution",
    label: "Solutions",
    singular: "Solution",
    description: "Business solution pages under /solutions. " + seoHelp,
    permission: "solutions.manage",
    titleField: "title",
    fields: [
      ...offeringBase("Solution"),
      { name: "tagline", label: "Tagline", type: "text", max: 255, colSpan: 2 },
      { name: "modules", label: "Modules", type: "items", help: "One per line: Module | Description", colSpan: 2, section: "Content" },
      { name: "customization", label: "Customisation statement", type: "textarea", colSpan: 2, section: "Content" },
      { name: "technologies", label: "Technologies", type: "list", section: "Content" },
      { name: "benefits", label: "Benefits", type: "list", section: "Content" },
      { name: "isFeatured", label: "Featured on homepage", type: "boolean", section: "Publishing" },
      ...publishing,
    ],
    columns: [
      { name: "title", label: "Title", sortable: true },
      { name: "status", label: "Status", type: "status", sortable: true },
      { name: "isFeatured", label: "Featured", type: "boolean" },
      { name: "sortOrder", label: "Order", type: "number", sortable: true },
      { name: "updatedAt", label: "Updated", type: "date", sortable: true },
    ],
    searchFields: ["title", "excerpt", "slug"],
    defaultSort: { field: "sortOrder", dir: "asc" },
    hasStatus: true,
    softDelete: true,
    hasSortOrder: true,
    cacheEntity: "solution",
    publicPath: "/solutions/{slug}",
    filters: [statusFilter],
  },
  industries: {
    key: "industries",
    model: "industry",
    label: "Industries",
    singular: "Industry",
    description: "Industry pages under /industries.",
    permission: "industries.manage",
    titleField: "title",
    fields: [
      ...offeringBase("Industry"),
      { name: "challenges", label: "Industry challenges", type: "list", section: "Content" },
      { name: "approach", label: "Our approach", type: "items", help: "One per line: Title | Description", colSpan: 2, section: "Content" },
      ...publishing,
    ],
    columns: [
      { name: "title", label: "Title", sortable: true },
      { name: "status", label: "Status", type: "status", sortable: true },
      { name: "sortOrder", label: "Order", type: "number", sortable: true },
      { name: "updatedAt", label: "Updated", type: "date", sortable: true },
    ],
    searchFields: ["title", "excerpt"],
    defaultSort: { field: "sortOrder", dir: "asc" },
    hasStatus: true,
    softDelete: true,
    hasSortOrder: true,
    cacheEntity: "industry",
    publicPath: "/industries/{slug}",
    filters: [statusFilter],
  },
  projects: {
    key: "projects",
    model: "project",
    label: "Portfolio",
    singular: "Project",
    description: "Portfolio case studies. Mark demonstration work as Demo — never present demos as real client work.",
    permission: "portfolio.manage",
    titleField: "title",
    fields: [
      { name: "title", label: "Project title", type: "text", required: true, max: 191 },
      { name: "slug", label: "Slug", type: "slug", from: "title", required: true },
      { name: "summary", label: "Summary", type: "textarea", required: true, colSpan: 2 },
      { name: "categoryId", label: "Category", type: "relation", relation: { model: "projectCategory", labelField: "name" } },
      { name: "industryId", label: "Client industry", type: "relation", relation: { model: "industry", labelField: "title", where: { deletedAt: null } } },
      { name: "clientName", label: "Client name", type: "text", help: "Only with the client's permission." },
      { name: "projectUrl", label: "Project URL", type: "url" },
      { name: "coverImageId", label: "Featured image", type: "media" },
      { name: "gallery", label: "Gallery", type: "gallery", colSpan: 2 },
      { name: "description", label: "Description", type: "richtext", colSpan: 2, section: "Case study" },
      { name: "challenges", label: "Challenges", type: "textarea", section: "Case study" },
      { name: "solutions", label: "Solutions", type: "textarea", section: "Case study" },
      { name: "results", label: "Results", type: "textarea", colSpan: 2, section: "Case study", help: "Only verified outcomes." },
      { name: "technologies", label: "Technologies", type: "list", section: "Case study" },
      { name: "services", label: "Related services", type: "relationMany", relation: { model: "service", labelField: "title", where: { deletedAt: null } }, section: "Case study" },
      { name: "isDemo", label: "Demonstration project (shows a Demo badge)", type: "boolean", section: "Publishing" },
      { name: "isFeatured", label: "Featured", type: "boolean", section: "Publishing" },
      ...publishing,
    ],
    columns: [
      { name: "title", label: "Title", sortable: true },
      { name: "category", label: "Category", type: "relation", relationField: "name" },
      { name: "status", label: "Status", type: "status", sortable: true },
      { name: "isFeatured", label: "Featured", type: "boolean" },
      { name: "isDemo", label: "Demo", type: "boolean" },
      { name: "updatedAt", label: "Updated", type: "date", sortable: true },
    ],
    searchFields: ["title", "summary", "clientName"],
    defaultSort: { field: "updatedAt", dir: "desc" },
    hasStatus: true,
    softDelete: true,
    hasSortOrder: true,
    cacheEntity: "project",
    publicPath: "/portfolio/{slug}",
    filters: [statusFilter],
    include: { category: true },
  },
  "project-categories": {
    key: "project-categories",
    model: "projectCategory",
    label: "Project Categories",
    singular: "Category",
    description: "Portfolio filter categories.",
    permission: "portfolio.manage",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
      { name: "sortOrder", label: "Display order", type: "number" },
    ],
    columns: [
      { name: "name", label: "Name", sortable: true },
      { name: "slug", label: "Slug" },
      { name: "sortOrder", label: "Order", type: "number", sortable: true },
    ],
    searchFields: ["name"],
    defaultSort: { field: "sortOrder", dir: "asc" },
    hasSortOrder: true,
    cacheEntity: "projectCategory",
  },
  team: {
    key: "team",
    model: "teamMember",
    label: "Team",
    singular: "Team member",
    description: "Team profiles shown on /team and the homepage.",
    permission: "team.manage",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 160 },
      { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
      { name: "position", label: "Position", type: "text", required: true },
      {
        name: "department",
        label: "Department",
        type: "select",
        required: true,
        options: [
          "Leadership", "Software Development", "AI Engineering", "Cloud Engineering", "System Engineering",
          "DevOps Engineering", "Security Engineering", "Quality Assurance", "UI/UX Design", "Digital Marketing",
          "Business Development",
        ].map((v) => ({ value: v, label: v })),
      },
      { name: "photoId", label: "Professional photo", type: "media", help: "Square or portrait photo works best." },
      { name: "experience", label: "Experience", type: "text", max: 60, placeholder: "e.g. 16+ years" },
      { name: "bio", label: "Biography", type: "textarea", colSpan: 2 },
      { name: "skills", label: "Skills / expertise", type: "list" },
      { name: "email", label: "Email", type: "email", section: "Contact & social" },
      { name: "phone", label: "Phone", type: "text", max: 40, placeholder: "+8801XXXXXXXXX", section: "Contact & social" },
      { name: "whatsapp", label: "WhatsApp number", type: "text", max: 40, placeholder: "+8801XXXXXXXXX", section: "Contact & social" },
      {
        name: "showContact",
        label: "Show email, phone & WhatsApp on the website",
        type: "boolean",
        help: "Off by default to protect privacy. Social links are always shown when filled in.",
        section: "Contact & social",
      },
      { name: "linkedinUrl", label: "LinkedIn URL", type: "url", section: "Contact & social" },
      { name: "facebookUrl", label: "Facebook URL", type: "url", section: "Contact & social" },
      { name: "instagramUrl", label: "Instagram URL", type: "url", section: "Contact & social" },
      { name: "githubUrl", label: "GitHub URL", type: "url", section: "Contact & social" },
      { name: "twitterUrl", label: "X / Twitter URL", type: "url", section: "Contact & social" },
      { name: "websiteUrl", label: "Personal website / portfolio", type: "url", section: "Contact & social" },
      ...publishing,
    ],
    columns: [
      { name: "name", label: "Name", sortable: true },
      { name: "position", label: "Position" },
      { name: "department", label: "Department", type: "badge", sortable: true },
      { name: "status", label: "Status", type: "status", sortable: true },
      { name: "sortOrder", label: "Order", type: "number", sortable: true },
    ],
    searchFields: ["name", "position", "department"],
    defaultSort: { field: "sortOrder", dir: "asc" },
    hasStatus: true,
    softDelete: true,
    hasSortOrder: true,
    cacheEntity: "team",
    filters: [statusFilter],
  },
  "blog-posts": {
    key: "blog-posts",
    model: "blogPost",
    label: "Blog Posts",
    singular: "Post",
    description: "Articles. Scheduled posts go live automatically at their scheduled time.",
    permission: "blog.manage",
    publishPermission: "blog.publish",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 255, colSpan: 2 },
      { name: "slug", label: "Slug", type: "slug", from: "title", required: true },
      { name: "categoryId", label: "Category", type: "relation", relation: { model: "blogCategory", labelField: "name" } },
      { name: "excerpt", label: "Excerpt", type: "textarea", required: true, max: 600, colSpan: 2 },
      { name: "coverImageId", label: "Cover image", type: "media" },
      { name: "tags", label: "Tags", type: "tags", help: "Comma-separated. New tags are created automatically." },
      { name: "content", label: "Content", type: "richtext", required: true, colSpan: 2 },
      { name: "isFeatured", label: "Featured post", type: "boolean", section: "Publishing" },
      { name: "status", label: "Status", type: "status", options: BLOG_STATUS, required: true, section: "Publishing" },
      { name: "scheduledFor", label: "Scheduled publish time", type: "datetime", section: "Publishing", help: "Required when status is Scheduled." },
    ],
    columns: [
      { name: "title", label: "Title", sortable: true },
      { name: "category", label: "Category", type: "relation", relationField: "name" },
      { name: "status", label: "Status", type: "status", sortable: true },
      { name: "publishedAt", label: "Published", type: "date", sortable: true },
      { name: "updatedAt", label: "Updated", type: "date", sortable: true },
    ],
    searchFields: ["title", "excerpt"],
    defaultSort: { field: "updatedAt", dir: "desc" },
    hasStatus: true,
    softDelete: true,
    cacheEntity: "blog",
    publicPath: "/blog/{slug}",
    filters: [{ name: "status", label: "Status", options: BLOG_STATUS }],
    include: { category: true },
  },
  "blog-categories": {
    key: "blog-categories",
    model: "blogCategory",
    label: "Blog Categories",
    singular: "Category",
    description: "Blog categories.",
    permission: "blog.manage",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
      { name: "description", label: "Description", type: "textarea", colSpan: 2 },
      { name: "sortOrder", label: "Display order", type: "number" },
    ],
    columns: [
      { name: "name", label: "Name", sortable: true },
      { name: "slug", label: "Slug" },
      { name: "sortOrder", label: "Order", type: "number", sortable: true },
    ],
    searchFields: ["name"],
    defaultSort: { field: "sortOrder", dir: "asc" },
    hasSortOrder: true,
    cacheEntity: "blogCategory",
  },
  "blog-tags": {
    key: "blog-tags",
    model: "blogTag",
    label: "Blog Tags",
    singular: "Tag",
    description: "Blog tags.",
    permission: "blog.manage",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 120 },
      { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
    ],
    columns: [
      { name: "name", label: "Name", sortable: true },
      { name: "slug", label: "Slug" },
      { name: "createdAt", label: "Created", type: "date", sortable: true },
    ],
    searchFields: ["name"],
    defaultSort: { field: "name", dir: "asc" },
    cacheEntity: "blogTag",
  },
  testimonials: {
    key: "testimonials",
    model: "testimonial",
    label: "Testimonials",
    singular: "Testimonial",
    description: "Only publish genuine testimonials you have permission to use.",
    permission: "testimonials.manage",
    titleField: "authorName",
    fields: [
      { name: "authorName", label: "Author name", type: "text", required: true },
      { name: "authorTitle", label: "Author title", type: "text" },
      { name: "company", label: "Company", type: "text" },
      { name: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5 },
      { name: "quote", label: "Quote", type: "textarea", required: true, colSpan: 2 },
      { name: "avatarId", label: "Photo", type: "media" },
      ...publishing,
    ],
    columns: [
      { name: "authorName", label: "Author", sortable: true },
      { name: "company", label: "Company" },
      { name: "status", label: "Status", type: "status", sortable: true },
      { name: "sortOrder", label: "Order", type: "number", sortable: true },
    ],
    searchFields: ["authorName", "company", "quote"],
    defaultSort: { field: "sortOrder", dir: "asc" },
    hasStatus: true,
    hasSortOrder: true,
    cacheEntity: "testimonial",
    filters: [statusFilter],
  },
  faqs: {
    key: "faqs",
    model: "fAQ",
    label: "FAQs",
    singular: "FAQ",
    description: "General FAQs appear on the contact page; service/solution FAQs appear on those pages.",
    permission: "faqs.manage",
    titleField: "question",
    fields: [
      { name: "question", label: "Question", type: "text", required: true, max: 500, colSpan: 2 },
      { name: "answer", label: "Answer", type: "textarea", required: true, colSpan: 2 },
      {
        name: "scope",
        label: "Show on",
        type: "select",
        required: true,
        options: [
          { value: "general", label: "General (contact page)" },
          { value: "service", label: "A service page" },
          { value: "solution", label: "A solution page" },
        ],
      },
      { name: "serviceId", label: "Service", type: "relation", relation: { model: "service", labelField: "title", where: { deletedAt: null } } },
      { name: "solutionId", label: "Solution", type: "relation", relation: { model: "solution", labelField: "title", where: { deletedAt: null } } },
      ...publishing,
    ],
    columns: [
      { name: "question", label: "Question", sortable: true },
      { name: "scope", label: "Scope", type: "badge", sortable: true },
      { name: "status", label: "Status", type: "status", sortable: true },
      { name: "sortOrder", label: "Order", type: "number", sortable: true },
    ],
    searchFields: ["question", "answer"],
    defaultSort: { field: "sortOrder", dir: "asc" },
    hasStatus: true,
    hasSortOrder: true,
    cacheEntity: "faq",
    filters: [
      statusFilter,
      { name: "scope", label: "Scope", options: [{ value: "general", label: "General" }, { value: "service", label: "Service" }, { value: "solution", label: "Solution" }] },
    ],
  },
  pages: {
    key: "pages",
    model: "page",
    label: "Pages",
    singular: "Page",
    description: "Standalone pages (privacy, terms, landing pages). Homepage & About sections are edited in the Homepage Builder.",
    permission: "pages.manage",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 191 },
      { name: "slug", label: "Slug", type: "slug", from: "title", required: true, help: "Page is served at /{slug}." },
      { name: "key", label: "Internal key", type: "slug", from: "slug", required: true, help: "Unique identifier; system pages keep theirs." },
      { name: "summary", label: "Summary", type: "textarea", colSpan: 2 },
      { name: "body", label: "Body", type: "richtext", colSpan: 2 },
      { name: "status", label: "Status", type: "status", options: STATUS_OPTIONS, required: true, section: "Publishing" },
    ],
    columns: [
      { name: "title", label: "Title", sortable: true },
      { name: "slug", label: "Slug" },
      { name: "isSystem", label: "System", type: "boolean" },
      { name: "status", label: "Status", type: "status", sortable: true },
      { name: "updatedAt", label: "Updated", type: "date", sortable: true },
    ],
    searchFields: ["title", "slug"],
    defaultSort: { field: "updatedAt", dir: "desc" },
    hasStatus: true,
    softDelete: true,
    cacheEntity: "page",
    publicPath: "/{slug}",
    filters: [statusFilter],
  },
  seo: {
    key: "seo",
    model: "sEO",
    label: "SEO",
    singular: "SEO entry",
    description: "Override meta title, description, canonical URL and social image for any URL path (e.g. /, /services/ai-integration-development).",
    permission: "seo.manage",
    titleField: "path",
    fields: [
      { name: "path", label: "URL path", type: "text", required: true, placeholder: "/services/custom-software-development", max: 255, colSpan: 2 },
      { name: "metaTitle", label: "Meta title", type: "text", max: 255, help: "Aim for 50–60 characters." },
      { name: "keywords", label: "Keywords", type: "text", max: 500, help: "Comma-separated (optional)." },
      { name: "metaDescription", label: "Meta description", type: "textarea", max: 500, colSpan: 2, help: "Aim for 140–160 characters." },
      { name: "canonicalUrl", label: "Canonical URL", type: "url" },
      { name: "ogImageUrl", label: "Social share image URL", type: "url" },
      { name: "noIndex", label: "Hide from search engines (noindex)", type: "boolean" },
    ],
    columns: [
      { name: "path", label: "Path", sortable: true },
      { name: "metaTitle", label: "Meta title" },
      { name: "noIndex", label: "Noindex", type: "boolean" },
      { name: "updatedAt", label: "Updated", type: "date", sortable: true },
    ],
    searchFields: ["path", "metaTitle"],
    defaultSort: { field: "path", dir: "asc" },
    cacheEntity: "seo",
  },
  redirects: {
    key: "redirects",
    model: "redirect",
    label: "Redirects",
    singular: "Redirect",
    description: "Redirect old URLs to new ones (applied within ~60 seconds).",
    permission: "seo.manage",
    titleField: "fromPath",
    fields: [
      { name: "fromPath", label: "From path", type: "text", required: true, placeholder: "/old-page", max: 255 },
      { name: "toPath", label: "To path or URL", type: "text", required: true, placeholder: "/new-page", max: 512 },
      {
        name: "statusCode",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "301", label: "301 — Permanent" },
          { value: "302", label: "302 — Temporary" },
          { value: "307", label: "307 — Temporary (keep method)" },
          { value: "308", label: "308 — Permanent (keep method)" },
        ],
      },
      { name: "isEnabled", label: "Enabled", type: "boolean" },
    ],
    columns: [
      { name: "fromPath", label: "From", sortable: true },
      { name: "toPath", label: "To" },
      { name: "statusCode", label: "Code", type: "number" },
      { name: "hits", label: "Hits", type: "number", sortable: true },
      { name: "isEnabled", label: "Enabled", type: "boolean" },
    ],
    searchFields: ["fromPath", "toPath"],
    defaultSort: { field: "fromPath", dir: "asc" },
    cacheEntity: "redirect",
  },
  "navigation-items": {
    key: "navigation-items",
    model: "navigationItem",
    label: "Navigation",
    singular: "Menu item",
    description: "Header and footer menus. Use the Menu filter to edit one menu at a time; set Parent to create a dropdown.",
    permission: "navigation.manage",
    titleField: "label",
    fields: [
      { name: "navigationId", label: "Menu", type: "relation", relation: { model: "navigation", labelField: "name" }, required: true },
      { name: "parentId", label: "Parent item (for dropdowns)", type: "relation", relation: { model: "navigationItem", labelField: "label", where: { parentId: null } } },
      { name: "label", label: "Label", type: "text", required: true, max: 120 },
      { name: "href", label: "Link", type: "text", required: true, placeholder: "/services or https://…", max: 512 },
      { name: "isExternal", label: "Open in new tab", type: "boolean" },
      { name: "isEnabled", label: "Visible", type: "boolean" },
      { name: "sortOrder", label: "Order", type: "number" },
    ],
    columns: [
      { name: "label", label: "Label", sortable: true },
      { name: "navigation", label: "Menu", type: "relation", relationField: "name" },
      { name: "parent", label: "Parent", type: "relation", relationField: "label" },
      { name: "href", label: "Link" },
      { name: "isEnabled", label: "Visible", type: "boolean" },
      { name: "sortOrder", label: "Order", type: "number", sortable: true },
    ],
    searchFields: ["label", "href"],
    defaultSort: { field: "sortOrder", dir: "asc" },
    hasSortOrder: true,
    cacheEntity: "navigation",
    include: { navigation: true, parent: true },
  },
};

export function getResource(key: string): Resource | undefined {
  return Object.prototype.hasOwnProperty.call(RESOURCES, key) ? RESOURCES[key] : undefined;
}
