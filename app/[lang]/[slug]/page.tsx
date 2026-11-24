import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/primitives";
import { RenderSection } from "@/components/sections/home-sections";
import { getPageBySlug, listCustomPageSlugs } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { sanitizeRichText } from "@/lib/security/sanitize";
import { dateLocale, t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 300;

const RESERVED = new Set(["home", "about", "contact"]);

export async function generateStaticParams() {
  return (await listCustomPageSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const page = RESERVED.has(slug) ? null : await getPageBySlug(slug);
  if (!page) return { title: t(lang, "notFound.meta") };
  return buildMetadata(`/${slug}`, { title: page.title, description: page.summary });
}

/** CMS-managed pages (privacy, terms, landing pages…) by slug. */
export default async function CmsPage({ params }: PageProps<"/[lang]/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  if (RESERVED.has(slug)) notFound();
  const page = await getPageBySlug(slug);
  if (!page) notFound();
  return (
    <>
      <PageHero title={page.title} description={page.summary} crumbs={[{ name: page.title, path: `/${page.slug}` }]} />
      {page.body && (
        <section>
          <Container className="max-w-3xl">
            <div className="prose-axs" dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.body) }} />
            <p className="mt-12 text-xs text-subtle">{t(lang, "common.lastUpdated", { date: new Date(page.updatedAt).toLocaleDateString(dateLocale[lang], { dateStyle: "long" }) })}</p>
          </Container>
        </section>
      )}
      {page.sections.map((s) => <RenderSection key={s.id} s={s} />)}
    </>
  );
}
