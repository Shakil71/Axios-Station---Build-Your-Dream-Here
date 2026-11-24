import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { ProcessSection } from "@/components/sections/home-sections";
import { ProjectCard } from "@/components/sections/cards";
import { ChallengeSolution, ConsultationCta, FaqList, FeatureGrid, TechAndBenefits } from "@/components/sections/detail-blocks";
import { FaqJsonLd, ServiceJsonLd } from "@/components/seo/json-ld";
import { getService, listServices } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { CoverArt } from "@/components/ui/cover-art";
import { LocaleLink } from "@/components/i18n/locale-provider";
import { localizeHref, t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await listServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/services/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const s = await getService(slug);
  if (!s) return { title: t(lang, "detail.serviceNotFound") };
  return buildMetadata(`/services/${slug}`, { title: s.title, description: s.excerpt, image: s.cover?.url });
}

export default async function ServicePage({ params }: PageProps<"/[lang]/services/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const s = await getService(slug);
  if (!s) notFound();
  const path = `/services/${s.slug}`;
  const topic = lang === "en" ? s.title : ((await getService(slug, "en"))?.title ?? s.title);

  return (
    <>
      <PageHero
        eyebrow={t(lang, "detail.service")}
        title={s.title}
        description={s.tagline ?? s.excerpt}
        icon={s.icon}
        crumbs={[{ name: t(lang, "services.eyebrow"), path: "/services" }, { name: s.title, path }]}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <LocaleLink href={`/contact?service=${encodeURIComponent(topic)}`} className={buttonVariants({ size: "lg" })}>
            {t(lang, "common.bookConsultation")} <ArrowRight />
          </LocaleLink>
          <LocaleLink href="/portfolio" className={buttonVariants({ size: "lg", variant: "secondary" })}>{t(lang, "common.viewWork")}</LocaleLink>
        </div>
      </PageHero>

      {(s.overview || s.cover) && (
        <section className="py-12">
          <Container className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionHeading eyebrow={t(lang, "common.overview")} title={t(lang, "detail.serviceOverview")} />
              <p className="mt-5 text-lg leading-relaxed text-muted">{s.overview ?? s.excerpt}</p>
            </div>
            <CoverArt media={s.cover} icon={s.icon} alt={s.title} className="aspect-[4/3] rounded-3xl border border-border" sizes="(min-width:1024px) 50vw, 100vw" />
          </Container>
        </section>
      )}

      <ChallengeSolution challenges={s.challenges} solution={s.solution} />
      <FeatureGrid eyebrow={t(lang, "detail.capabilities")} title={t(lang, "detail.keyFeatures")} items={s.features} />
      <TechAndBenefits technologies={s.technologies} benefits={s.benefits} />
      {s.process.length > 0 && (
        <ProcessSection
          s={{ id: "p", type: "process", title: t(lang, "detail.devProcess"), subtitle: t(lang, "detail.howDeliver"), description: null, ctaLabel: null, ctaHref: null, cta2Label: null, cta2Href: null, image: null, items: s.process, list: [], stats: [], limit: 5 }}
        />
      )}

      {s.projects.length > 0 && (
        <section className="py-16">
          <Container>
            <SectionHeading eyebrow={t(lang, "common.portfolio")} title={t(lang, "common.relatedProjects")} />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {s.projects.map((p, i) => <ProjectCard key={p.slug} project={p} index={i} />)}
            </div>
          </Container>
        </section>
      )}

      <FaqList faqs={s.faqs} />
      <ConsultationCta topic={topic} />
      <ServiceJsonLd name={s.title} description={s.excerpt} path={localizeHref(path, lang)} image={s.cover?.url} />
      <FaqJsonLd faqs={s.faqs} />
    </>
  );
}
