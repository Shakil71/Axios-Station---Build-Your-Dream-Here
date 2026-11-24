/**
 * Cache key conventions:  axs:pub:<namespace>[:<qualifier>]
 * Only public, non-sensitive data is ever cached. Admin responses and user
 * data are never written to Redis (except rate-limit counters under axs:rl:).
 */
export const CACHE_PREFIX = "axs:pub";

export const cacheKeys = {
  navigation: (key: string) => `${CACHE_PREFIX}:nav:${key}`,
  settings: () => `${CACHE_PREFIX}:settings`,
  homepage: () => `${CACHE_PREFIX}:page:home`,
  page: (key: string) => `${CACHE_PREFIX}:page:${key}`,
  services: () => `${CACHE_PREFIX}:services:list`,
  service: (slug: string) => `${CACHE_PREFIX}:services:item:${slug}`,
  solutions: () => `${CACHE_PREFIX}:solutions:list`,
  solution: (slug: string) => `${CACHE_PREFIX}:solutions:item:${slug}`,
  industries: () => `${CACHE_PREFIX}:industries:list`,
  industry: (slug: string) => `${CACHE_PREFIX}:industries:item:${slug}`,
  projects: (q: string) => `${CACHE_PREFIX}:projects:list:${q}`,
  projectCategories: () => `${CACHE_PREFIX}:projects:categories`,
  project: (slug: string) => `${CACHE_PREFIX}:projects:item:${slug}`,
  team: () => `${CACHE_PREFIX}:team:list`,
  testimonials: () => `${CACHE_PREFIX}:testimonials:list`,
  faqs: (scope: string) => `${CACHE_PREFIX}:faqs:${scope}`,
  blogList: (q: string) => `${CACHE_PREFIX}:blog:list:${q}`,
  blogCategories: () => `${CACHE_PREFIX}:blog:categories`,
  blogPost: (slug: string) => `${CACHE_PREFIX}:blog:item:${slug}`,
  seo: (path: string) => `${CACHE_PREFIX}:seo:${path}`,
  redirects: () => `${CACHE_PREFIX}:redirects`,
  i18n: (entity: string, locale: string) => `${CACHE_PREFIX}:i18n:${entity}:${locale}`,
} as const;

/** Which cache namespaces to drop when an entity type changes. */
export const invalidationMap: Record<string, string[]> = {
  service: ["services", "page", "faqs", "projects"],
  solution: ["solutions", "page", "faqs"],
  industry: ["industries", "page", "projects"],
  project: ["projects", "page", "services"],
  projectCategory: ["projects"],
  team: ["team", "page"],
  blog: ["blog", "page"],
  blogCategory: ["blog"],
  blogTag: ["blog"],
  testimonial: ["testimonials", "page"],
  faq: ["faqs", "services", "solutions"],
  page: ["page"],
  navigation: ["nav"],
  settings: ["settings", "nav", "page"],
  seo: ["seo"],
  redirect: ["redirects"],
  translation: ["i18n"],
  media: ["services", "solutions", "industries", "projects", "team", "blog", "testimonials", "page"],
};
