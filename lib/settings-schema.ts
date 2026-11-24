/**
 * Site settings registry — every key the CMS can edit, its group, input type
 * and default. Contact details, social links, theme and analytics config all
 * live here (stored in the SiteSetting table) rather than in source code.
 */
export type SettingField = {
  key: string;
  label: string;
  group: SettingGroup;
  type: "text" | "textarea" | "email" | "url" | "boolean" | "select" | "list";
  options?: string[];
  help?: string;
  default: string | boolean | string[];
  isPublic?: boolean;
};

export type SettingGroup = "general" | "contact" | "social" | "theme" | "analytics" | "footer" | "leads";

export const SETTING_GROUPS: Record<SettingGroup, { title: string; description: string; permission: "settings.manage" | "analytics.manage" }> = {
  general: { title: "Website Settings", description: "Brand name, tagline and default descriptions.", permission: "settings.manage" },
  contact: { title: "Contact Information", description: "Shown on the contact page, footer and structured data.", permission: "settings.manage" },
  social: { title: "Social Media", description: "Profile links shown in the footer and Organization schema.", permission: "settings.manage" },
  theme: { title: "Theme Settings", description: "Default colour mode and visual options.", permission: "settings.manage" },
  analytics: { title: "Analytics Settings", description: "Google Analytics / Search Console. Tracking only loads after visitor consent.", permission: "analytics.manage" },
  footer: { title: "Footer", description: "Footer text and copyright line.", permission: "settings.manage" },
  leads: { title: "Lead Form", description: "Options offered on the contact form.", permission: "settings.manage" },
};

export const SETTINGS: SettingField[] = [
  { key: "site.name", label: "Site name", group: "general", type: "text", default: "Axios Station" },
  { key: "site.foundingYear", label: "Founded (year)", group: "general", type: "text", default: "2024", help: "Used in search-engine data about the company.", isPublic: true },
  { key: "site.tagline", label: "Tagline", group: "general", type: "text", default: "Build Your Dream Here." },
  {
    key: "site.description",
    label: "Default meta description",
    group: "general",
    type: "textarea",
    default:
      "Axios Station engineers custom software, AI integrations, cloud infrastructure and intelligent business automation that drive measurable growth.",
  },
  { key: "site.positioning", label: "Brand positioning line", group: "general", type: "text", default: "Whatever your business needs, Axios Station engineers the technology to make it happen." },

  { key: "contact.email", label: "Public email", group: "contact", type: "email", default: "" },
  { key: "contact.phone", label: "Phone", group: "contact", type: "text", default: "" },
  { key: "contact.whatsapp", label: "WhatsApp number", group: "contact", type: "text", default: "" },
  { key: "contact.address", label: "Address", group: "contact", type: "textarea", default: "" },
  { key: "contact.hours", label: "Business hours", group: "contact", type: "text", default: "" },
  { key: "contact.mapEmbedUrl", label: "Google Maps embed URL", group: "contact", type: "url", default: "", help: "Optional. Must be an https://www.google.com/maps/embed URL." },

  { key: "social.facebook", label: "Facebook", group: "social", type: "url", default: "https://www.facebook.com/profile.php?id=61557907092178" },
  { key: "social.linkedin", label: "LinkedIn", group: "social", type: "url", default: "" },
  { key: "social.x", label: "X (Twitter)", group: "social", type: "url", default: "" },
  { key: "social.youtube", label: "YouTube", group: "social", type: "url", default: "" },
  { key: "social.github", label: "GitHub", group: "social", type: "url", default: "" },
  { key: "social.instagram", label: "Instagram", group: "social", type: "url", default: "" },

  { key: "theme.defaultMode", label: "Default colour mode", group: "theme", type: "select", options: ["dark", "light", "system"], default: "dark" },
  { key: "theme.showSwitcher", label: "Show light/dark switcher", group: "theme", type: "boolean", default: true },
  { key: "theme.animatedBackground", label: "Animated background effects", group: "theme", type: "boolean", default: true },

  { key: "analytics.gaMeasurementId", label: "Google Analytics measurement ID", group: "analytics", type: "text", default: "", help: "e.g. G-XXXXXXX. Leave empty to disable.", isPublic: true },
  { key: "analytics.gscVerification", label: "Google Search Console verification token", group: "analytics", type: "text", default: "", help: "Only the content value of the google-site-verification meta tag." },
  { key: "analytics.bingVerification", label: "Bing Webmaster Tools verification token", group: "analytics", type: "text", default: "", help: "The content value of the msvalidate.01 meta tag. Bing also powers DuckDuckGo and Yahoo results." },
  { key: "analytics.facebookVerification", label: "Facebook domain verification token", group: "analytics", type: "text", default: "", help: "From Meta Business Settings → Brand safety → Domains. Needed for ad tracking on your own domain." },
  { key: "analytics.internalPageViews", label: "Record anonymous page views (first-party)", group: "analytics", type: "boolean", default: true, help: "Stores path + referrer only. No cookies, no personal data." },

  { key: "footer.about", label: "Footer description", group: "footer", type: "textarea", default: "We engineer intelligent, scalable and reliable technology that simplifies operations, accelerates growth and creates lasting business value." },
  { key: "footer.copyright", label: "Copyright holder", group: "footer", type: "text", default: "Axios Station" },

  {
    key: "leads.budgetRanges",
    label: "Budget ranges",
    group: "leads",
    type: "list",
    default: ["Under $5,000", "$5,000 – $15,000", "$15,000 – $50,000", "$50,000+", "Not sure yet"],
  },
];

export type SettingsMap = Record<string, string | boolean | string[]>;

export function defaultSettings(): SettingsMap {
  return Object.fromEntries(SETTINGS.map((s) => [s.key, s.default]));
}

export function str(settings: SettingsMap, key: string): string {
  const v = settings[key];
  return typeof v === "string" ? v : "";
}
export function bool(settings: SettingsMap, key: string): boolean {
  return settings[key] === true;
}
export function list(settings: SettingsMap, key: string): string[] {
  const v = settings[key];
  return Array.isArray(v) ? v : [];
}
