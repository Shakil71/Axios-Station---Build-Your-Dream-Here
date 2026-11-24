import { ChevronRight } from "lucide-react";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { DynamicIcon } from "@/components/ui/icon";
import { LocaleLink } from "@/components/i18n/locale-provider";
import { localizeHref, t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

export function PageHero({
  eyebrow,
  title,
  description,
  crumbs,
  icon,
  children,
}: {
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  crumbs: { name: string; path: string }[];
  icon?: string | null;
  children?: React.ReactNode;
}) {
  const lang = getLocale();
  const all = [{ name: t(lang, "common.home"), path: "/" }, ...crumbs];
  return (
    <section className="relative overflow-hidden pt-32 pb-16 sm:pt-36 lg:pb-20">
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[70%] -translate-x-1/2 rounded-full bg-brand/15 blur-[120px]" aria-hidden />
      <Container className="relative">
        <nav aria-label={t(lang, "common.breadcrumb")}>
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-subtle">
            {all.map((c, i) => (
              <li key={c.path} className="flex items-center gap-1.5">
                {i < all.length - 1 ? (
                  <LocaleLink href={c.path} className="hover:text-fg">{c.name}</LocaleLink>
                ) : (
                  <span aria-current="page" className="text-muted">{c.name}</span>
                )}
                {i < all.length - 1 && <ChevronRight className="h-3 w-3" />}
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-8 flex items-start gap-5">
          {icon && (
            <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_16px_40px_-14px_var(--brand)] sm:flex">
              <DynamicIcon name={icon} className="h-7 w-7" />
            </span>
          )}
          <div className="max-w-3xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              <span className="text-gradient">{title}</span>
            </h1>
            {description && <p className="mt-5 text-lg leading-relaxed text-muted">{description}</p>}
            {children && <div className="mt-8">{children}</div>}
          </div>
        </div>
      </Container>
      <BreadcrumbJsonLd items={all.map((c) => ({ ...c, path: localizeHref(c.path, lang) }))} />
    </section>
  );
}
