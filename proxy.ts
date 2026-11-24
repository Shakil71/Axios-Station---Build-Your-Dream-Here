import { NextResponse, type NextRequest } from "next/server";
import { findRedirect, recordRedirectHit } from "@/services/redirects";
import { defaultLocale } from "@/lib/i18n";

/**
 * Runs before routes:
 *  1. Optimistic admin gate: no session cookie → straight to /admin/login.
 *     (Real authorization happens server-side in every admin page/action/API.)
 *  2. CMS-managed redirects for public paths.
 *  3. Languages: English is served at unprefixed URLs (rewritten internally
 *     to /en/...), Bengali at /bn/.... /en/... redirects to the clean URL.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !pathname.startsWith("/admin/reset-password")) {
    const hasSession =
      req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token");
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  if (!pathname.startsWith("/api") && !pathname.startsWith("/admin")) {
    const rule = await findRedirect(pathname);
    if (rule) {
      void recordRedirectHit(pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname);
      const target = rule.to.startsWith("http") ? rule.to : new URL(rule.to, req.url).toString();
      return NextResponse.redirect(target, rule.code === 302 ? 302 : rule.code === 307 ? 307 : rule.code === 308 ? 308 : 301);
    }
  }

  if (!pathname.startsWith("/api") && !pathname.startsWith("/admin") && !/\.[a-z0-9]{2,12}$/i.test(pathname)) {
    if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.slice(defaultLocale.length + 1) || "/";
      return NextResponse.redirect(url, 308);
    }
    if (pathname !== "/bn" && !pathname.startsWith("/bn/")) {
      const url = req.nextUrl.clone();
      url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_vercel|images/|uploads/|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml).*)"],
};
