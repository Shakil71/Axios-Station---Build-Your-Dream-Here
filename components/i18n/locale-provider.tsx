"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, type ComponentProps } from "react";
import { Languages } from "lucide-react";
import { defaultLocale, localizeHref, stripLocale, translator, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={lang}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT() {
  return translator(useLocale());
}

/** next/link that keeps visitors in their language (adds /bn to internal links). */
export function LocaleLink({ href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const lang = useLocale();
  return <Link href={localizeHref(href, lang)} {...props} />;
}

/**
 * Switches between English and Bengali on the same page. A plain <a> (full
 * page load) on purpose: the two languages are separate route trees, and a
 * fresh document also resets <html lang>.
 */
export function LanguageSwitcher({ className, full = false }: { className?: string; full?: boolean }) {
  const lang = useLocale();
  const t = useT();
  const pathname = usePathname() ?? "/";
  const other: Locale = lang === "bn" ? "en" : "bn";
  const target = localizeHref(stripLocale(pathname), other);
  return (
    <a
      href={target}
      hrefLang={other}
      lang={other}
      aria-label={t("lang.switchLabel")}
      title={t("lang.switchLabel")}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-fg",
        className,
      )}
    >
      <Languages className="h-4 w-4" />
      <span className={full ? "" : "hidden sm:inline"}>{t("lang.switch")}</span>
    </a>
  );
}
