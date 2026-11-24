import { Suspense } from "react";
import { PageHero } from "@/components/sections/page-hero";
import { Container, EmptyState } from "@/components/ui/primitives";
import { PostCard } from "@/components/sections/cards";
import { SearchBox } from "@/components/sections/search-box";
import { Pagination } from "@/components/sections/pagination";
import { NewsletterForm } from "@/components/sections/newsletter-form";
import { listBlogCategories, listPosts } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { LocaleLink } from "@/components/i18n/locale-provider";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/blog">) {
  const lang = initLocale((await params).lang);
  return buildMetadata("/blog", { title: t(lang, "blog.metaTitle"), description: t(lang, "blog.metaDesc") });
}

export default async function BlogPage({ params, searchParams }: PageProps<"/[lang]/blog">) {
  const lang = initLocale((await params).lang);
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const page = Number(typeof sp.page === "string" ? sp.page : 1) || 1;
  const [categories, result] = await Promise.all([listBlogCategories(), listPosts({ category, tag, q, page })]);

  return (
    <>
      <PageHero eyebrow={t(lang, "blog.eyebrow")} title={t(lang, "blog.title")} description={t(lang, "blog.desc")} crumbs={[{ name: t(lang, "blog.eyebrow"), path: "/blog" }]} />
      <section>
        <Container>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
              {[{ slug: undefined as string | undefined, name: t(lang, "common.all") }, ...categories].map((c) => {
                const active = (category ?? "") === (c.slug ?? "");
                const params = new URLSearchParams();
                if (c.slug) params.set("category", c.slug);
                return (
                  <LocaleLink
                    key={c.slug ?? "all"}
                    href={`/blog${params.size ? `?${params}` : ""}`}
                    className={cn("whitespace-nowrap rounded-full border px-4 py-2 text-sm transition", active ? "border-brand bg-brand/15 text-fg" : "border-border text-muted hover:text-fg")}
                  >
                    {c.name}
                  </LocaleLink>
                );
              })}
            </div>
            <Suspense>
              <SearchBox placeholder={t(lang, "blog.search")} clearLabel={t(lang, "common.clearSearch")} className="lg:w-72" />
            </Suspense>
          </div>
          {tag && <p className="mt-6 text-sm text-muted">{t(lang, "blog.tagged")} <span className="font-semibold text-fg">#{tag}</span> · <LocaleLink href="/blog" className="text-brand-2">{t(lang, "blog.clear")}</LocaleLink></p>}
          <h2 className="sr-only">{t(lang, "blog.list")}</h2>
          <div className="mt-10">
            {result.items.length ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {result.items.map((p, i) => <PostCard key={p.slug} post={p} index={i} />)}
              </div>
            ) : (
              <EmptyState title={t(lang, "blog.empty")} description={q || category || tag ? t(lang, "common.tryDifferent") : t(lang, "blog.emptyDesc")}>
                {!(q || category || tag) && <NewsletterForm source="blog-empty" className="max-w-md" />}
              </EmptyState>
            )}
          </div>
          <Pagination page={result.page} pages={result.pages} basePath="/blog" params={{ category, tag, q }} />
        </Container>
      </section>
    </>
  );
}
