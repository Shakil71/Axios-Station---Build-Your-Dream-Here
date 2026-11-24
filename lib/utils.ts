import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(d: Date | string | null | undefined, locale = "en-US") {
  if (!d) return "";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(d));
}

/** Safely coerce a Prisma Json value into a string[]. */
export function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
}

export type TitledItem = { title: string; description: string };

/** Safely coerce a Prisma Json value into {title, description}[]. */
export function asTitledItems(v: unknown): TitledItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    .map((x) => ({ title: String(x.title ?? ""), description: String(x.description ?? "") }))
    .filter((x) => x.title);
}

export function siteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Only allow same-site relative paths or http(s) URLs in CMS-provided links. */
export function safeHref(href: string | null | undefined, fallback = "#"): string {
  if (!href) return fallback;
  const h = href.trim();
  if (h.startsWith("/") && !h.startsWith("//")) return h;
  if (/^https?:\/\//i.test(h) || /^mailto:/i.test(h) || /^tel:/i.test(h)) return h;
  if (h.startsWith("#")) return h;
  return fallback;
}
