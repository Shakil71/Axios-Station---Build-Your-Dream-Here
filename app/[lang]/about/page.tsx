import { ArrowRight, Eye, Target } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { DynamicIcon } from "@/components/ui/icon";
import { ProcessSection, TeamSection, CtaSection } from "@/components/sections/home-sections";
import { getPage, listServices, type SectionDTO } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { aboutPage, processSteps } from "@/lib/content/defaults";
import { LocaleLink } from "@/components/i18n/locale-provider";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/about">) {
  const lang = initLocale((await params).lang);
  return buildMetadata("/about", { title: t(lang, "about.metaTitle"), description: t(lang, "about.metaDesc") });
}

const valueIcons = ["ShieldCheck", "Sparkles", "Briefcase", "BrainCircuit", "Users", "Rocket"];

function blank(type: string, extra: Partial<SectionDTO> = {}): SectionDTO {
  return { id: type, type, title: null, subtitle: null, description: null, ctaLabel: null, ctaHref: null, cta2Label: null, cta2Href: null, image: null, items: [], list: [], stats: [], limit: 4, ...extra };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const lang = initLocale((await params).lang);
  const page = await getPage("about");
  const sections: SectionDTO[] =
    page?.sections ??
    aboutPage.sections.map((s) =>
      blank(s.type, {
        title: s.title ?? null,
        subtitle: "subtitle" in s ? (s.subtitle ?? null) : null,
        description: "description" in s ? (s.description ?? null) : null,
        items: "data" in s && s.data ? (s.data.items as SectionDTO["items"]) : [],
      }),
    );
  const by = (t: string) => sections.find((s) => s.type === t);
  const intro = by("intro");
  const mission = by("mission");
  const vision = by("vision");
  const values = by("values");
  const philosophy = by("philosophy");
  const milestones = by("milestones");
  const services = (await listServices()).slice(0, 8);
  // The delivery process is managed once, in the homepage "process" section (and its Bengali version).
  const home = await getPage("home");
  const processItems = home?.sections.find((x) => x.type === "process")?.items ?? processSteps;

  return (
    <>
      <PageHero
        eyebrow={intro?.subtitle ?? t(lang, "about.eyebrow")}
        title={intro?.title ?? t(lang, "about.title")}
        description={intro?.description}
        crumbs={[{ name: t(lang, "about.crumb"), path: "/about" }]}
      />

      {(mission || vision) && (
        <section className="py-12">
          <Container className="grid gap-5 md:grid-cols-2">
            {[{ s: mission, Icon: Target }, { s: vision, Icon: Eye }].map(({ s, Icon }) =>
              s ? (
                <Reveal key={s.type}>
                  <div className="glass ring-gradient h-full rounded-3xl p-8 lg:p-10">
                    <Icon className="h-8 w-8 text-brand-2" />
                    <h2 className="mt-6 text-2xl font-bold">{s.title}</h2>
                    <p className="mt-3 text-base leading-relaxed text-muted">{s.description}</p>
                  </div>
                </Reveal>
              ) : null,
            )}
          </Container>
        </section>
      )}

      {values && values.items.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading eyebrow={t(lang, "about.guides")} title={values.title} align="center" />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.items.map((v, i) => (
                <Reveal key={v.title} delay={i * 0.05}>
                  <div className="glass h-full rounded-2xl p-6">
                    <DynamicIcon name={valueIcons[i % valueIcons.length]} className="h-6 w-6 text-brand-2" />
                    <h3 className="mt-5 font-semibold">{v.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{v.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {philosophy && (
        <section className="py-16">
          <Container>
            <Reveal>
              <blockquote className="mx-auto max-w-4xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-2">{philosophy.title}</p>
                <p className="mt-6 font-display text-2xl font-semibold leading-snug sm:text-4xl">
                  <span className="text-gradient">{philosophy.description}</span>
                </p>
              </blockquote>
            </Reveal>
          </Container>
        </section>
      )}

      {services.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading eyebrow={t(lang, "about.expertise")} title={t(lang, "about.greatAt")} action={<LocaleLink href="/services" className={buttonVariants({ variant: "secondary" })}>{t(lang, "about.allServices")} <ArrowRight /></LocaleLink>} />
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {services.map((s) => (
                <LocaleLink key={s.slug} href={`/services/${s.slug}`} className="glass flex items-center gap-3 rounded-xl p-4 text-sm font-medium transition hover:bg-surface-2">
                  <DynamicIcon name={s.icon} className="h-5 w-5 shrink-0 text-brand-2" />
                  {s.title}
                </LocaleLink>
              ))}
            </div>
          </Container>
        </section>
      )}

      <ProcessSection s={blank("process", { subtitle: t(lang, "about.approach"), title: t(lang, "about.howDeliver"), items: processItems })} />
      <TeamSection s={blank("team", { subtitle: t(lang, "about.teamEyebrow"), title: t(lang, "about.teamTitle"), ctaLabel: t(lang, "about.meetTeam"), ctaHref: "/team" })} />

      {milestones && milestones.items.length > 0 && (
        <section className="py-20">
          <Container>
            <SectionHeading eyebrow={t(lang, "about.journey")} title={milestones.title} description={milestones.description} />
            <ol className="relative mt-12 space-y-8 border-l border-border pl-8">
              {milestones.items.map((m) => (
                <li key={m.title} className="relative">
                  <span className="absolute -left-[37px] top-1 h-3 w-3 rounded-full bg-brand shadow-[0_0_12px_var(--brand)]" />
                  <p className="font-display text-sm font-bold text-brand-2">{m.title}</p>
                  <p className="mt-1 text-muted">{m.description}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      <CtaSection
        s={blank("cta", {
          title: t(lang, "about.ctaTitle"),
          description: t(lang, "about.ctaDesc"),
          ctaLabel: t(lang, "common.bookConsultation"),
          ctaHref: "/contact",
        })}
      />
    </>
  );
}
