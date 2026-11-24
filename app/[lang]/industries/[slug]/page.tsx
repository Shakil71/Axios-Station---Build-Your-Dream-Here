import { notFound } from "next/navigation";
import { PageHero } from "@/components/sections/page-hero";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { ProjectCard } from "@/components/sections/cards";
import { ChallengeSolution, ConsultationCta, FeatureGrid } from "@/components/sections/detail-blocks";
import { getIndustry, listIndustries } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listIndustries()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/industries/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const s = await getIndustry(slug);
  if (!s) return { title: t(lang, "detail.industryNotFound") };
  return buildMetadata(`/industries/${slug}`, { title: t(lang, "detail.industryMeta", { x: s.title }), description: s.excerpt, image: s.cover?.url });
}

export default async function IndustryPage({ params }: PageProps<"/[lang]/industries/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const s = await getIndustry(slug);
  if (!s) notFound();
  return (
    <>
      <PageHero eyebrow={t(lang, "detail.industry")} title={s.title} description={s.overview ?? s.excerpt} icon={s.icon} crumbs={[{ name: t(lang, "industries.eyebrow"), path: "/industries" }, { name: s.title, path: `/industries/${s.slug}` }]} />
      <ChallengeSolution challenges={s.challenges} solution={null} />
      <FeatureGrid eyebrow={t(lang, "detail.approach")} title={t(lang, "detail.howWeHelp", { x: lang === "en" ? s.title.toLowerCase() : s.title })} items={s.approach} />
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
      <ConsultationCta />
    </>
  );
}
