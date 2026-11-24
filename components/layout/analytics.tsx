"use client";

import { LocaleLink as Link, useT } from "@/components/i18n/locale-provider";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setLocalStorage, useLocalStorage } from "@/hooks/use-dom-value";

const CONSENT_KEY = "axs-consent";

/**
 * - First-party page views: anonymous (path + referrer, no cookies), only when enabled in CMS.
 * - Google Analytics: loaded ONLY after the visitor accepts the consent banner.
 */
export function Analytics({ gaId, internal }: { gaId: string; internal: boolean }) {
  const pathname = usePathname();
  const t = useT();
  const stored = useLocalStorage(CONSENT_KEY);
  // undefined = not yet known (server render) → show nothing until hydrated.
  const consent = stored === undefined ? "unknown" : stored === "granted" || stored === "denied" ? stored : null;

  useEffect(() => {
    if (!internal || !pathname || pathname.startsWith("/admin")) return;
    const body = JSON.stringify({ type: "page_view", path: pathname, referrer: document.referrer.slice(0, 500) });
    try {
      navigator.sendBeacon?.("/api/analytics", new Blob([body], { type: "application/json" }));
    } catch {
      /* ignore */
    }
  }, [pathname, internal]);

  function decide(v: "granted" | "denied") {
    setLocalStorage(CONSENT_KEY, v);
  }

  const validGa = /^G-[A-Z0-9]{4,20}$/.test(gaId);

  return (
    <>
      {validGa && consent === "granted" && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {validGa && consent === null && (
        <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl sm:inset-x-auto sm:right-4 sm:left-auto" role="dialog" aria-label={t("cookie.dialog")}>
          <div className="glass rounded-2xl p-4 shadow-card sm:p-5">
            <p className="text-sm text-fg">{t("cookie.text")}</p>
            <p className="mt-1 text-xs text-muted">
              {t("cookie.sub")} <Link href="/privacy" className="underline">{t("cookie.privacy")}</Link>.
            </p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => decide("granted")} className="rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white cursor-pointer">
                {t("cookie.accept")}
              </button>
              <button onClick={() => decide("denied")} className="rounded-lg border border-border-strong px-3.5 py-2 text-xs font-semibold text-fg cursor-pointer">
                {t("cookie.decline")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Footer link that lets a visitor change their analytics choice (re-opens the consent banner). */
export function CookieSettingsButton() {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => {
        try {
          localStorage.removeItem(CONSENT_KEY);
        } catch {
          /* storage blocked */
        }
        // Notify subscribers (the banner) in this tab.
        setLocalStorage("axs-consent-reset", String(Date.now()));
      }}
      className="cursor-pointer hover:text-fg"
    >
      {t("cookie.settings")}
    </button>
  );
}
