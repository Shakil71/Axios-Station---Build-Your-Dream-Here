import "server-only";
import { env } from "@/lib/env";
import { locales, localizeHref } from "@/lib/i18n";
import { siteUrl } from "@/lib/utils";

/** Where search engines verify the key (served by app/indexnow-key.txt/route.ts). */
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

/**
 * IndexNow: tell Bing, Yandex, Seznam and other participating search engines
 * that pages changed, so they are re-crawled within minutes instead of days.
 * Runs only in production with INDEXNOW_KEY set and a real public site URL.
 * Failures are logged and never affect the admin save.
 */
export async function announceUrls(paths: string[]): Promise<void> {
  const key = env.INDEXNOW_KEY;
  const base = siteUrl();
  if (!key || env.NODE_ENV !== "production" || /localhost|127\.0\.0\.1|192\.168\./.test(base) || paths.length === 0) return;
  const urlList = [...new Set(paths.flatMap((p) => locales.map((l) => siteUrl(localizeHref(p, l)))))];
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(base).host, key, keyLocation: siteUrl(INDEXNOW_KEY_PATH), urlList }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok && res.status !== 202) console.warn("[indexnow] rejected", res.status);
  } catch (e) {
    console.warn("[indexnow] failed", e instanceof Error ? e.message : e);
  }
}
