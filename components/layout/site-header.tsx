"use client";

import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn, safeHref } from "@/lib/utils";
import { LanguageSwitcher, LocaleLink as Link, useT } from "@/components/i18n/locale-provider";
import { stripLocale } from "@/lib/i18n";

export type HeaderNavItem = { id: string; label: string; href: string; isExternal: boolean; children: HeaderNavItem[] };

export function SiteHeader({ items, siteName, showThemeToggle }: { items: HeaderNavItem[]; siteName: string; showThemeToggle: boolean }) {
  const pathname = usePathname() ?? "/";
  const path = stripLocale(pathname);
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  // The drawer is open only for the path it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);

  // Desktop dropdown (e.g. "Company"): opens only on click (never on hover).
  // It closes after choosing a link, on navigation, on any other click and on Escape.
  const [menu, setMenu] = useState<{ id: string; path: string } | null>(null);
  const openMenu = menu && menu.path === pathname ? menu.id : null;
  const navRef = useRef<HTMLElement>(null);
  const closeMenu = () => setMenu(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const navItems = items.filter((i) => i.href !== "/contact");

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-border bg-bg/75 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo name={siteName} />

        <nav ref={navRef} className="hidden items-center gap-1 lg:flex" aria-label={t("nav.main")}>
          {navItems.map((item) =>
            item.children.length ? (
              <div key={item.id} className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setMenu((m) => (m?.id === item.id && m.path === pathname ? null : { id: item.id, path: pathname }))
                  }
                  className={cn(
                    "inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition cursor-pointer",
                    openMenu === item.id || item.children.some((c) => isActive(c.href)) ? "text-fg" : "text-muted hover:text-fg",
                  )}
                  aria-haspopup="true"
                  aria-expanded={openMenu === item.id}
                  aria-controls={`menu-${item.id}`}
                >
                  {item.label}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", openMenu === item.id && "rotate-180")} />
                </button>
                <div
                  id={`menu-${item.id}`}
                  className={cn(
                    "absolute left-1/2 top-full w-56 -translate-x-1/2 pt-2 transition-all duration-200",
                    openMenu === item.id ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
                  )}
                >
                  <div className="glass rounded-2xl p-2 shadow-card">
                    {item.children.map((c) => (
                      <Link
                        key={c.id}
                        href={safeHref(c.href)}
                        target={c.isExternal ? "_blank" : undefined}
                        rel={c.isExternal ? "noopener noreferrer" : undefined}
                        tabIndex={openMenu === item.id ? undefined : -1}
                        onClick={(e) => {
                          closeMenu();
                          e.currentTarget.blur();
                        }}
                        className={cn(
                          "block rounded-xl px-3 py-2.5 text-sm transition",
                          isActive(c.href) ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
                        )}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.id}
                href={safeHref(item.href)}
                target={item.isExternal ? "_blank" : undefined}
                rel={item.isExternal ? "noopener noreferrer" : undefined}
                onClick={closeMenu}
                className={cn("relative rounded-lg px-3.5 py-2 text-sm font-medium transition", isActive(item.href) ? "text-fg" : "text-muted hover:text-fg")}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-brand-2 to-brand" />
                )}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          {showThemeToggle && <ThemeToggle />}
          <Link href="/contact" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
            {t("common.bookConsultationShort")}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-fg hover:bg-surface-2 lg:hidden cursor-pointer"
            onClick={() => setOpen(true)}
            aria-label={t("nav.openMenu")}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open && (
        <>
          <div
            className="animate-fade-in fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside
            id="mobile-nav"
            className="animate-drawer-in fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col border-l border-border bg-bg-2 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menu")}
          >
            <div className="flex h-[72px] items-center justify-between px-5">
              <Logo name={siteName} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface-2 cursor-pointer"
                aria-label={t("nav.closeMenu")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label={t("nav.mobile")}>
              {items.map((item) => (
                <div key={item.id} className="border-b border-border py-1">
                  {item.children.length ? (
                    <>
                      <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-widest text-subtle">{item.label}</p>
                      {item.children.map((c) => (
                        <Link key={c.id} href={safeHref(c.href)} className="flex items-center justify-between rounded-xl px-3 py-3 text-base text-fg hover:bg-surface-2">
                          {c.label}
                          <ArrowRight className="h-4 w-4 text-subtle" />
                        </Link>
                      ))}
                    </>
                  ) : (
                    <Link
                      href={safeHref(item.href)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-medium",
                        isActive(item.href) ? "text-brand-2" : "text-fg hover:bg-surface-2",
                      )}
                    >
                      {item.label}
                      <ArrowRight className="h-4 w-4 text-subtle" />
                    </Link>
                  )}
                </div>
              ))}
            </nav>
            <div className="space-y-3 border-t border-border p-5">
              <LanguageSwitcher full className="w-full justify-center border border-border" />
              <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                {t("common.bookConsultation")}
              </Link>
            </div>
          </aside>
        </>
      )}
    </header>
  );
}
