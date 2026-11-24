import { PageHero } from "@/components/sections/page-hero";
import { Container, EmptyState } from "@/components/ui/primitives";
import { OfferingCard } from "@/components/sections/cards";
import { Reveal } from "@/components/ui/reveal";
import { ConsultationCta } from "@/components/sections/detail-blocks";
import { listSolutions } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/solutions">) {
  const lang = initLocale((await params).lang);
  return buildMetadata("/solutions", { title: t(lang, "solutions.metaTitle"), description: t(lang, "solutions.metaDesc") });
}

export default async function SolutionsPage({ params }: PageProps<"/[lang]/solutions">) {
  const lang = initLocale((await params).lang);
  const list = await listSolutions();
  return (
    <>
      <PageHero
        eyebrow={t(lang, "solutions.eyebrow")}
        title={t(lang, "solutions.title")}
        description={t(lang, "solutions.desc")}
        crumbs={[{ name: t(lang, "solutions.eyebrow"), path: "/solutions" }]}
      />
      <section className="pb-8">
        <Container>
          <h2 className="sr-only">{t(lang, "solutions.all")}</h2>
          {list.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s, i) => (
                <Reveal key={s.slug} delay={(i % 3) * 0.05}>
                  <OfferingCard href={`/solutions/${s.slug}`} title={s.title} excerpt={s.excerpt} icon={s.icon} index={i} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title={t(lang, "solutions.empty")} description={t(lang, "services.emptyDesc")} />
          )}
        </Container>
      </section>
      <ConsultationCta />
    </>
  );
}
