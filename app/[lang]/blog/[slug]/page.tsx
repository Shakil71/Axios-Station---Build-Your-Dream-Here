import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Container, Badge, SectionHeading } from "@/components/ui/primitives";
import { CoverArt } from "@/components/ui/cover-art";
import { PostCard } from "@/components/sections/cards";
import { NewsletterForm } from "@/components/sections/newsletter-form";
import { ArticleJsonLd } from "@/components/seo/json-ld";
import { ShareButtons } from "@/components/sections/share-buttons";
import { getPost, listPosts } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { sanitizeRichText } from "@/lib/security/sanitize";
import { formatDate, siteUrl } from "@/lib/utils";
import { LocaleLink } from "@/components/i18n/locale-provider";
import { dateLocale, localizeHref, t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 120;

export async function generateStaticParams() {
  return (await listPosts({ perPage: 48 }, "en")).items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/blog/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const p = await getPost(slug);
  if (!p) return { title: t(lang, "blog.notFound") };
  return buildMetadata(`/blog/${slug}`, { title: p.title, description: p.excerpt, image: p.cover?.url, type: "article", publishedTime: p.publishedAt });
}

export default async function PostPage({ params }: PageProps<"/[lang]/blog/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const p = await getPost(slug);
  if (!p) notFound();
  const path = `/blog/${p.slug}`;
  return (
    <>
      <PageHero eyebrow={p.category?.name ?? t(lang, "blog.article")} title={p.title} description={p.excerpt} crumbs={[{ name: t(lang, "blog.eyebrow"), path: "/blog" }, { name: p.title, path }]}>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
          {p.author && <span className="font-medium text-fg">{p.author}</span>}
          {p.publishedAt && <time dateTime={p.publishedAt}>{formatDate(p.publishedAt, dateLocale[lang])}</time>}
          <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {t(lang, "common.minRead", { n: p.readingMinutes })}</span>
        </div>
      </PageHero>
      <article>
        <Container className="max-w-4xl">
          {p.cover && <CoverArt media={p.cover} alt={p.title} priority className="aspect-[16/9] rounded-3xl border border-border" sizes="(min-width:1024px) 900px, 100vw" />}
          <div className="prose-axs mt-12" dangerouslySetInnerHTML={{ __html: sanitizeRichText(p.content) }} />
          <div className="mt-12 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {p.tags.map((tag) => (
                <LocaleLink key={tag.slug} href={`/blog?tag=${tag.slug}`}><Badge tone="muted">#{tag.name}</Badge></LocaleLink>
              ))}
            </div>
            <ShareButtons url={siteUrl(localizeHref(path, lang))} title={p.title} />
          </div>
          <div className="glass mt-12 rounded-2xl p-6 sm:p-8">
            <p className="text-lg font-semibold">{t(lang, "blog.enjoyed")}</p>
            <p className="mt-1 text-sm text-muted">{t(lang, "blog.enjoyedText")}</p>
            <NewsletterForm source="blog-post" className="mt-4 max-w-md" />
          </div>
        </Container>
      </article>
      {p.related.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading eyebrow={t(lang, "blog.keepReading")} title={t(lang, "blog.related")} />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {p.related.map((r, i) => <PostCard key={r.slug} post={r} index={i} />)}
            </div>
          </Container>
        </section>
      )}
      <ArticleJsonLd title={p.title} description={p.excerpt} path={localizeHref(path, lang)} image={p.cover?.url} publishedAt={p.publishedAt} updatedAt={p.updatedAt} author={p.author} tags={p.tags.map((tag) => tag.name)} section={p.category?.name} />
    </>
  );
}
