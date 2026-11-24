import { ArrowRight, CheckCircle2, ChevronDown, AlertTriangle } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import type { TitledItem } from "@/lib/utils";
import { LocaleLink } from "@/components/i18n/locale-provider";
import { getT } from "@/lib/i18n/server";

export function FaqList({ faqs, title }: { faqs: { question: string; answer: string }[]; title?: string }) {
  if (!faqs.length) return null;
  const t = getT();
  return (
    <section className="py-16">
      <Container className="max-w-4xl">
        <SectionHeading eyebrow={t("detail.faq")} title={title ?? t("detail.faqTitle")} align="center" />
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.question} className="group glass rounded-2xl px-6 py-1 open:bg-surface-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-fg [&::-webkit-details-marker]:hidden">
                {f.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-subtle transition group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted">{f.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function FeatureGrid({ eyebrow, title, items }: { eyebrow: string; title: string; items: TitledItem[] }) {
  if (!items.length) return null;
  return (
    <section className="py-16">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} />
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {items.map((f, i) => (
            <Reveal key={f.title} delay={(i % 2) * 0.06}>
              <div className="glass ring-gradient h-full rounded-2xl p-6">
                <span className="font-display text-sm font-bold text-brand-gradient">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function ChallengeSolution({ challenges, solution, solutionTitle }: { challenges: string[]; solution?: string | null; solutionTitle?: string }) {
  if (!challenges.length && !solution) return null;
  const t = getT();
  return (
    <section className="py-16">
      <Container className="grid gap-6 lg:grid-cols-2">
        {challenges.length > 0 && (
          <Reveal>
            <div className="h-full rounded-3xl border border-border bg-bg-2/60 p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-warning">{t("detail.challenges")}</p>
              <ul className="mt-6 space-y-4">
                {challenges.map((c) => (
                  <li key={c} className="flex gap-3 text-fg/90">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning/80" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
        {solution && (
          <Reveal delay={0.08}>
            <div className="relative h-full overflow-hidden rounded-3xl border border-brand/30 p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-brand-2/10" aria-hidden />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-2">{solutionTitle ?? t("detail.ourSolution")}</p>
                <p className="mt-6 text-lg leading-relaxed text-fg">{solution}</p>
              </div>
            </div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}

export function TechAndBenefits({ technologies, benefits }: { technologies: string[]; benefits: string[] }) {
  if (!technologies.length && !benefits.length) return null;
  const t = getT();
  return (
    <section className="py-16">
      <Container className="grid gap-6 lg:grid-cols-2">
        {technologies.length > 0 && (
          <div className="glass rounded-3xl p-8">
            <h2 className="text-xl font-bold">{t("common.technologies")}</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {technologies.map((t) => <Badge key={t} className="px-3 py-1 text-sm">{t}</Badge>)}
            </div>
          </div>
        )}
        {benefits.length > 0 && (
          <div className="glass rounded-3xl p-8">
            <h2 className="text-xl font-bold">{t("detail.benefits")}</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-fg">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {b}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}

export function ConsultationCta({ topic }: { topic?: string }) {
  const href = topic ? `/contact?service=${encodeURIComponent(topic)}` : "/contact";
  const t = getT();
  return (
    <section className="py-16">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-brand/25 p-8 sm:p-12">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-deep/50 via-bg-2 to-bg-2" aria-hidden />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold sm:text-3xl">{t("detail.readyTitle")}</h2>
              <p className="mt-2 text-muted">{t("detail.readyText")}</p>
            </div>
            <LocaleLink href={href} className={buttonVariants({ size: "lg" })}>
              {t("common.bookConsultation")} <ArrowRight />
            </LocaleLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
