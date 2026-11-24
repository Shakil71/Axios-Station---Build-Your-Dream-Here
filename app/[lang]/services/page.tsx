import { PageHero } from "@/components/sections/page-hero";
import { Container, EmptyState } from "@/components/ui/primitives";
import { OfferingCard } from "@/components/sections/cards";
import { Reveal } from "@/components/ui/reveal";
import { ConsultationCta } from "@/components/sections/detail-blocks";
import { listServices } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/services">) {
  const lang = initLocale((await params).lang);
  return buildMetadata("/services", { title: t(lang, "services.metaTitle"), description: t(lang, "services.metaDesc") });
}

export default async function ServicesPage({ params }: PageProps<"/[lang]/services">) {
  const lang = initLocale((await params).lang);
  const list = await listServices();
  return (
    <>
      <PageHero
        eyebrow={t(lang, "services.eyebrow")}
        title={t(lang, "services.title")}
        description={t(lang, "services.desc")}
        crumbs={[{ name: t(lang, "services.eyebrow"), path: "/services" }]}
      />
      <section className="pb-8">
        <Container>
          <h2 className="sr-only">{t(lang, "services.all")}</h2>
          {list.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((s, i) => (
                <Reveal key={s.slug} delay={(i % 3) * 0.05}>
                  <OfferingCard href={`/services/${s.slug}`} title={s.title} excerpt={s.excerpt} icon={s.icon} index={i} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title={t(lang, "services.empty")} description={t(lang, "services.emptyDesc")} />
          )}
        </Container>
      </section>
      <ConsultationCta />
    </>
  );
}
