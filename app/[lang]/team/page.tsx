import { PageHero } from "@/components/sections/page-hero";
import { Container, EmptyState } from "@/components/ui/primitives";
import { TeamCard } from "@/components/sections/cards";
import { Reveal } from "@/components/ui/reveal";
import { ConsultationCta } from "@/components/sections/detail-blocks";
import { listTeam } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { TeamJsonLd } from "@/components/seo/json-ld";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/team">) {
  const lang = initLocale((await params).lang);
  return buildMetadata("/team", { title: t(lang, "team.metaTitle"), description: t(lang, "team.metaDesc") });
}

export default async function TeamPage({ params }: PageProps<"/[lang]/team">) {
  const lang = initLocale((await params).lang);
  const team = await listTeam();
  // Leadership first, then everyone else in one grid (small departments would otherwise leave lonely rows).
  const groups = [
    { key: "leadership", title: t(lang, "team.leadership"), members: team.filter((m) => m.department === "Leadership") },
    { key: "others", title: t(lang, "team.others"), members: team.filter((m) => m.department !== "Leadership") },
  ].filter((g) => g.members.length > 0);
  return (
    <>
      <TeamJsonLd members={team} />
      <PageHero
        eyebrow={t(lang, "team.eyebrow")}
        title={t(lang, "team.title")}
        description={t(lang, "team.desc")}
        crumbs={[{ name: t(lang, "team.eyebrow"), path: "/team" }]}
      />
      <section>
        <Container>
          {team.length === 0 ? (
            <EmptyState title={t(lang, "team.empty")} description={t(lang, "team.emptyDesc")} />
          ) : (
            <div className="space-y-16">
              {groups.map((g) => (
                <div key={g.key}>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-2">{g.title}</h2>
                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {g.members.map((m, i) => (
                      <Reveal key={m.slug} delay={(i % 4) * 0.05}>
                        <TeamCard member={m} detailed />
                      </Reveal>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
      <ConsultationCta />
    </>
  );
}
