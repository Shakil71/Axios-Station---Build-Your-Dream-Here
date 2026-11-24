import { notFound } from "next/navigation";
import { ArrowRight, Settings2 } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { ConsultationCta, FaqList, FeatureGrid, TechAndBenefits } from "@/components/sections/detail-blocks";
import { FaqJsonLd, ServiceJsonLd } from "@/components/seo/json-ld";
import { CoverArt } from "@/components/ui/cover-art";
import { getSolution, listSolutions } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { LocaleLink } from "@/components/i18n/locale-provider";
import { localizeHref, t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listSolutions()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/solutions/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const s = await getSolution(slug);
  if (!s) return { title: t(lang, "detail.solutionNotFound") };
  return buildMetadata(`/solutions/${slug}`, { title: s.title, description: s.excerpt, image: s.cover?.url });
}

export default async function SolutionPage({ params }: PageProps<"/[lang]/solutions/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const s = await getSolution(slug);
  if (!s) notFound();
  const path = `/solutions/${s.slug}`;
  const topic = lang === "en" ? s.title : ((await getSolution(slug, "en"))?.title ?? s.title);
  return (
    <>
      <PageHero eyebrow={t(lang, "detail.solution")} title={s.title} description={s.tagline ?? s.excerpt} icon={s.icon} crumbs={[{ name: t(lang, "solutions.eyebrow"), path: "/solutions" }, { name: s.title, path }]}>
        <LocaleLink href={`/contact?service=${encodeURIComponent(topic)}`} className={buttonVariants({ size: "lg" })}>
          {t(lang, "detail.requestDemo")} <ArrowRight />
        </LocaleLink>
      </PageHero>

      <section className="py-12">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow={t(lang, "common.overview")} title={t(lang, "detail.whatItDoes")} />
            <p className="mt-5 text-lg leading-relaxed text-muted">{s.overview ?? s.excerpt}</p>
          </div>
          <CoverArt media={s.cover} icon={s.icon} alt={s.title} className="aspect-[4/3] rounded-3xl border border-border" sizes="(min-width:1024px) 50vw, 100vw" />
        </Container>
      </section>

      <FeatureGrid eyebrow={t(lang, "detail.modules")} title={t(lang, "detail.coreModules")} items={s.modules} />

      {s.customization && (
        <section className="py-16">
          <Container>
            <div className="relative overflow-hidden rounded-3xl border border-brand/30 p-8 sm:p-12">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-brand-2/10" aria-hidden />
              <div className="relative grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
                <Settings2 className="h-10 w-10 text-brand-2" />
                <div>
                  <h2 className="text-2xl font-bold">{t(lang, "detail.customised")}</h2>
                  <p className="mt-3 text-lg leading-relaxed text-muted">{s.customization}</p>
                </div>
              </div>
            </div>
          </Container>
        </section>
      )}

      <TechAndBenefits technologies={s.technologies} benefits={s.benefits} />
      <FaqList faqs={s.faqs} />
      <ConsultationCta topic={topic} />
      <ServiceJsonLd name={s.title} description={s.excerpt} path={localizeHref(path, lang)} image={s.cover?.url} />
      <FaqJsonLd faqs={s.faqs} />
    </>
  );
}
