import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Analytics } from "@/components/layout/analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getNavigation, getSettings, listServices } from "@/services/public";
import { bool, str } from "@/lib/settings-schema";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { htmlLang, isLocale, locales, ogLocale, t } from "@/lib/i18n";
import { setLocale } from "@/lib/i18n/server";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  setLocale(lang);
  const s = await getSettings();
  const name = str(s, "site.name") || "Axios Station";
  return {
    title: { default: `${name} — ${str(s, "site.tagline")}`, template: `%s | ${name}` },
    description: str(s, "site.description"),
    openGraph: { type: "website", siteName: name, locale: ogLocale[lang], images: [{ url: "/images/brand/og-default.png", width: 1200, height: 630, alt: name }] },
    twitter: { card: "summary_large_image", images: ["/images/brand/og-default.png"] },
  };
}

export default async function PublicLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  setLocale(lang);
  const [settings, header, services] = await Promise.all([getSettings(), getNavigation("header"), listServices()]);
  return (
    <LocaleProvider lang={lang}>
      {/* The root <html> is shared with the admin; this marks the language of everything visible. */}
      <div lang={htmlLang[lang]} className={lang === "bn" ? "font-bn" : undefined}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          {t(lang, "common.skip")}
        </a>
        <SiteHeader items={header.items} siteName={str(settings, "site.name") || "Axios Station"} showThemeToggle={bool(settings, "theme.showSwitcher")} />
        <main id="main" className="relative">{children}</main>
        <SiteFooter />
        <OrganizationJsonLd settings={settings} services={services.map((s) => s.title)} />
        <Analytics gaId={str(settings, "analytics.gaMeasurementId")} internal={bool(settings, "analytics.internalPageViews")} />
        {/* Vercel Web Analytics + Speed Insights (cookieless). Only on Vercel: their scripts do not exist on other hosts or locally. */}
        {process.env.VERCEL === "1" && (
          <>
            <VercelAnalytics />
            <SpeedInsights />
          </>
        )}
      </div>
    </LocaleProvider>
  );
}
