/**
 * Permission catalogue. These keys are the single source of truth: they are
 * seeded into the Permission table and checked on the server for every admin
 * page, server action and API route.
 */
export const PERMISSIONS = {
  "dashboard.view": { group: "General", description: "View the admin dashboard" },
  "pages.manage": { group: "Content", description: "Manage pages" },
  "homepage.manage": { group: "Content", description: "Manage homepage builder sections" },
  "services.manage": { group: "Content", description: "Manage services" },
  "solutions.manage": { group: "Content", description: "Manage solutions" },
  "industries.manage": { group: "Content", description: "Manage industries" },
  "portfolio.manage": { group: "Content", description: "Manage portfolio projects & categories" },
  "team.manage": { group: "Content", description: "Manage team members" },
  "blog.manage": { group: "Blog", description: "Create and edit blog posts, categories and tags" },
  "blog.publish": { group: "Blog", description: "Publish, schedule and unpublish blog posts" },
  "testimonials.manage": { group: "Content", description: "Manage testimonials" },
  "faqs.manage": { group: "Content", description: "Manage FAQs" },
  "media.manage": { group: "Media", description: "Upload, edit and delete media" },
  "navigation.manage": { group: "Site", description: "Manage header & footer navigation" },
  "settings.manage": { group: "Site", description: "Manage website, contact, social, theme settings" },
  "seo.manage": { group: "Marketing", description: "Manage SEO metadata and redirects" },
  "analytics.manage": { group: "Marketing", description: "Manage analytics settings and view analytics" },
  "newsletter.manage": { group: "Marketing", description: "Manage and export newsletter subscribers" },
  "leads.view": { group: "Sales", description: "View leads & inquiries" },
  "leads.manage": { group: "Sales", description: "Update, assign, reply to and export leads" },
  "users.manage": { group: "Administration", description: "Manage users" },
  "roles.manage": { group: "Administration", description: "Manage roles & permissions" },
  "logs.view": { group: "Administration", description: "View activity logs" },
  "maintenance.manage": { group: "Administration", description: "Cache, backup and maintenance tools" },
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

const CONTENT: Permission[] = [
  "pages.manage", "homepage.manage", "services.manage", "solutions.manage", "industries.manage",
  "portfolio.manage", "team.manage", "blog.manage", "blog.publish", "testimonials.manage", "faqs.manage",
  "media.manage", "navigation.manage",
];

/** Default system roles (seeded; Super Admin may adjust non-system permissions later). */
export const DEFAULT_ROLES: Record<string, { name: string; description: string; permissions: Permission[] }> = {
  super_admin: { name: "Super Admin", description: "Full access to everything", permissions: ALL_PERMISSIONS },
  admin: {
    name: "Admin",
    description: "Manage website and business content",
    permissions: [
      "dashboard.view", ...CONTENT, "settings.manage", "seo.manage", "analytics.manage",
      "newsletter.manage", "leads.view", "leads.manage", "logs.view",
    ],
  },
  editor: {
    name: "Editor",
    description: "Manage pages, blogs and media",
    permissions: ["dashboard.view", "pages.manage", "homepage.manage", "blog.manage", "blog.publish", "media.manage", "faqs.manage"],
  },
  marketing_manager: {
    name: "Marketing Manager",
    description: "Manage campaigns, blogs and SEO",
    permissions: [
      "dashboard.view", "blog.manage", "blog.publish", "seo.manage", "analytics.manage",
      "newsletter.manage", "testimonials.manage", "media.manage",
    ],
  },
  sales_manager: {
    name: "Sales Manager",
    description: "Manage leads and inquiries",
    permissions: ["dashboard.view", "leads.view", "leads.manage"],
  },
};

export function isPermission(v: string): v is Permission {
  return v in PERMISSIONS;
}
