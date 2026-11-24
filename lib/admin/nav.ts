import type { Permission } from "@/lib/auth/permissions";

export type AdminNavItem = { label: string; href: string; icon: string; permission: Permission | Permission[] };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  { title: "Overview", items: [{ label: "Dashboard", href: "/admin", icon: "LayoutDashboard", permission: "dashboard.view" }] },
  {
    title: "Website",
    items: [
      { label: "Homepage Builder", href: "/admin/homepage", icon: "LayoutTemplate", permission: "homepage.manage" },
      { label: "Pages", href: "/admin/content/pages", icon: "FileText", permission: "pages.manage" },
      { label: "Navigation", href: "/admin/content/navigation-items", icon: "Menu", permission: "navigation.manage" },
      { label: "Media Library", href: "/admin/media", icon: "Image", permission: "media.manage" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Services", href: "/admin/content/services", icon: "Code2", permission: "services.manage" },
      { label: "Solutions", href: "/admin/content/solutions", icon: "Boxes", permission: "solutions.manage" },
      { label: "Industries", href: "/admin/content/industries", icon: "Building2", permission: "industries.manage" },
      { label: "Portfolio", href: "/admin/content/projects", icon: "Briefcase", permission: "portfolio.manage" },
      { label: "Project Categories", href: "/admin/content/project-categories", icon: "Tags", permission: "portfolio.manage" },
      { label: "Team", href: "/admin/content/team", icon: "Users", permission: "team.manage" },
      { label: "Testimonials", href: "/admin/content/testimonials", icon: "Quote", permission: "testimonials.manage" },
      { label: "FAQs", href: "/admin/content/faqs", icon: "HelpCircle", permission: "faqs.manage" },
    ],
  },
  {
    title: "Blog",
    items: [
      { label: "Posts", href: "/admin/content/blog-posts", icon: "PenSquare", permission: "blog.manage" },
      { label: "Categories", href: "/admin/content/blog-categories", icon: "FolderTree", permission: "blog.manage" },
      { label: "Tags", href: "/admin/content/blog-tags", icon: "Hash", permission: "blog.manage" },
    ],
  },
  {
    title: "Sales & Marketing",
    items: [
      { label: "Leads", href: "/admin/leads", icon: "Inbox", permission: "leads.view" },
      { label: "Newsletter", href: "/admin/newsletter", icon: "Mail", permission: "newsletter.manage" },
      { label: "SEO", href: "/admin/content/seo", icon: "Search", permission: "seo.manage" },
      { label: "Redirects", href: "/admin/content/redirects", icon: "CornerUpRight", permission: "seo.manage" },
      { label: "Analytics", href: "/admin/analytics", icon: "BarChart3", permission: "analytics.manage" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Website Settings", href: "/admin/settings/general", icon: "Settings", permission: "settings.manage" },
      { label: "Contact Information", href: "/admin/settings/contact", icon: "Phone", permission: "settings.manage" },
      { label: "Social Media", href: "/admin/settings/social", icon: "Share2", permission: "settings.manage" },
      { label: "Theme", href: "/admin/settings/theme", icon: "Palette", permission: "settings.manage" },
      { label: "Footer", href: "/admin/settings/footer", icon: "PanelBottom", permission: "settings.manage" },
      { label: "Lead Form", href: "/admin/settings/leads", icon: "ClipboardList", permission: "settings.manage" },
      { label: "Analytics Settings", href: "/admin/settings/analytics", icon: "Activity", permission: "analytics.manage" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Users", href: "/admin/users", icon: "UserCog", permission: "users.manage" },
      { label: "Roles & Permissions", href: "/admin/roles", icon: "ShieldCheck", permission: "roles.manage" },
      { label: "Activity Logs", href: "/admin/activity", icon: "History", permission: "logs.view" },
      { label: "AI Integrations", href: "/admin/ai", icon: "BrainCircuit", permission: "maintenance.manage" },
      { label: "Backup & Maintenance", href: "/admin/maintenance", icon: "Wrench", permission: "maintenance.manage" },
    ],
  },
];
