import { PageHero } from "@/components/sections/page-hero";
import { Container, EmptyState } from "@/components/ui/primitives";
import { OfferingCard } from "@/components/sections/cards";
import { Reveal } from "@/components/ui/reveal";
import { ConsultationCta } from "@/components/sections/detail-blocks";
import { listIndustries } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/industries">) {
  const lang = initLocale((await params).lang);
  return buildMetadata("/industries", { title: t(lang, "industries.metaTitle"), description: t(lang, "industries.metaDesc") });
}

export default async function IndustriesPage({ params }: PageProps<"/[lang]/industries">) {
  const lang = initLocale((await params).lang);
  const list = await listIndustries();
  return (
    <>
      <PageHero
        eyebrow={t(lang, "industries.eyebrow")}
        title={t(lang, "industries.title")}
        description={t(lang, "industries.desc")}
        crumbs={[{ name: t(lang, "industries.eyebrow"), path: "/industries" }]}
      />
      <section className="pb-8">
        <Container>
          <h2 className="sr-only">{t(lang, "industries.all")}</h2>
          {list.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s, i) => (
                <Reveal key={s.slug} delay={(i % 3) * 0.05}>
                  <OfferingCard href={`/industries/${s.slug}`} title={s.title} excerpt={s.excerpt} icon={s.icon} index={i} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title={t(lang, "industries.empty")} />
          )}
        </Container>
      </section>
      <ConsultationCta />
    </>
  );
}
