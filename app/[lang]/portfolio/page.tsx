import { Suspense } from "react";
import { PageHero } from "@/components/sections/page-hero";
import { Container, EmptyState } from "@/components/ui/primitives";
import { ProjectCard } from "@/components/sections/cards";
import { SearchBox } from "@/components/sections/search-box";
import { Pagination } from "@/components/sections/pagination";
import { ConsultationCta } from "@/components/sections/detail-blocks";
import { listProjectCategories, listProjects } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { LocaleLink } from "@/components/i18n/locale-provider";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/portfolio">) {
  const lang = initLocale((await params).lang);
  return buildMetadata("/portfolio", { title: t(lang, "portfolio.metaTitle"), description: t(lang, "portfolio.metaDesc") });
}

export default async function PortfolioPage({ params, searchParams }: PageProps<"/[lang]/portfolio">) {
  const lang = initLocale((await params).lang);
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : 1) || 1;
  const [categories, result] = await Promise.all([listProjectCategories(), listProjects({ category, q, page, perPage: 9 })]);

  const chip = (slug: string | undefined, label: string) => {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (q) params.set("q", q);
    const active = (category ?? "") === (slug ?? "");
    return (
      <LocaleLink
        key={slug ?? "all"}
        href={`/portfolio${params.size ? `?${params}` : ""}`}
        scroll={false}
        aria-current={active ? "true" : undefined}
        className={cn(
          "whitespace-nowrap rounded-full border px-4 py-2 text-sm transition",
          active ? "border-brand bg-brand/15 text-fg" : "border-border text-muted hover:border-border-strong hover:text-fg",
        )}
      >
        {label}
      </LocaleLink>
    );
  };

  return (
    <>
      <PageHero
        eyebrow={t(lang, "portfolio.eyebrow")}
        title={t(lang, "portfolio.title")}
        description={t(lang, "portfolio.desc")}
        crumbs={[{ name: t(lang, "portfolio.eyebrow"), path: "/portfolio" }]}
      />
      <section>
        <Container>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
              {chip(undefined, t(lang, "common.all"))}
              {categories.map((c) => chip(c.slug, c.name))}
            </div>
            <Suspense>
              <SearchBox placeholder={t(lang, "portfolio.search")} clearLabel={t(lang, "common.clearSearch")} className="lg:w-72" />
            </Suspense>
          </div>

          <h2 className="sr-only">{t(lang, "portfolio.list")}</h2>
          <div className="mt-10">
            {result.items.length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {result.items.map((p, i) => <ProjectCard key={p.slug} project={p} index={i} priority={i < 3} />)}
              </div>
            ) : (
              <EmptyState title={t(lang, "portfolio.empty")} description={q || category ? t(lang, "common.tryDifferent") : t(lang, "portfolio.emptyDesc")} />
            )}
          </div>
          <Pagination page={result.page} pages={result.pages} basePath="/portfolio" params={{ category, q }} />
        </Container>
      </section>
      <ConsultationCta />
    </>
  );
}
