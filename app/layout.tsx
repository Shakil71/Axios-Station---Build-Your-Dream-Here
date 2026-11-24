import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Manrope, Sora } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/services/public";
import { str } from "@/lib/settings-schema";
import { siteUrl } from "@/lib/utils";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans-family", display: "swap" });
// Bengali glyphs: the browser only downloads this font when Bengali text is on the page (unicode-range).
const bengali = Hind_Siliguri({ subsets: ["bengali"], variable: "--font-bn-family", display: "swap", weight: ["400", "500", "600", "700"], preload: false });
const display = Sora({ subsets: ["latin"], variable: "--font-display-family", display: "swap", weight: ["500", "600", "700", "800"] });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = str(s, "site.name") || "Axios Station";
  const tagline = str(s, "site.tagline");
  const gsc = str(s, "analytics.gscVerification");
  const bing = str(s, "analytics.bingVerification");
  const fb = str(s, "analytics.facebookVerification");
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${name} — ${tagline || "AI, Software & Cloud Engineering"}`, template: `%s | ${name}` },
    description: str(s, "site.description"),
    applicationName: name,
    openGraph: { type: "website", siteName: name, locale: "en_US" },
    twitter: { card: "summary_large_image" },
    verification: {
      ...(gsc ? { google: gsc } : {}),
      other: { ...(bing ? { "msvalidate.01": bing } : {}), ...(fb ? { "facebook-domain-verification": fb } : {}) },
    },
    alternates: { canonical: "/", types: { "application/rss+xml": [{ url: "/feed.xml", title: "Axios Station — Blog" }] } },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060913" },
    { media: "(prefers-color-scheme: light)", color: "#f6f8fc" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const mode = str(s, "theme.defaultMode") || "dark";
  // Runs before paint: sets <html lang> for /bn pages and avoids a theme flash (reads only localStorage + media query).
  const themeScript = `(function(){try{var p=location.pathname;if(p==='/bn'||p.indexOf('/bn/')===0)document.documentElement.lang='bn';}catch(e){}try{var d=${JSON.stringify(mode)};var t=localStorage.getItem('axs-theme')||d;if(t==='system'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`;
  return (
    <html lang="en" data-theme={mode === "light" ? "light" : "dark"} className={`${sans.variable} ${display.variable} ${bengali.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
