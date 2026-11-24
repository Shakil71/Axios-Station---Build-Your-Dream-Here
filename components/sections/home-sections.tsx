import Image from "next/image";
import { ArrowRight, CheckCircle2, Quote, Star } from "lucide-react";
import { Container, SectionHeading, Eyebrow } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { DynamicIcon } from "@/components/ui/icon";
import { HeroVisual } from "./hero-visual";
import { NewsletterForm } from "./newsletter-form";
import { OfferingCard, PostCard, ProjectCard, TeamCard } from "./cards";
import { cn, safeHref } from "@/lib/utils";
import { LocaleLink as Link } from "@/components/i18n/locale-provider";
import { getT } from "@/lib/i18n/server";
import {
  listIndustries, listPosts, listProjects, listServices, listSolutions, listTeam, listTestimonials, type SectionDTO,
} from "@/services/public";

const capabilityIcons = ["BrainCircuit", "Cloud", "Code2", "Workflow", "BarChart3", "ShieldCheck", "Cpu", "Database"];
const whyIcons = ["Compass", "Layers", "ShieldCheck", "Activity", "TrendingUp", "Users"];

function CtaButtons({ s, center }: { s: SectionDTO; center?: boolean }) {
  if (!s.ctaLabel && !s.cta2Label) return null;
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", center && "justify-center")}>
      {s.ctaLabel && (
        <Link href={safeHref(s.ctaHref, "/contact")} className={buttonVariants({ size: "lg" })}>
          {s.ctaLabel} <ArrowRight />
        </Link>
      )}
      {s.cta2Label && (
        <Link href={safeHref(s.cta2Href, "/")} className={buttonVariants({ size: "lg", variant: "secondary" })}>
          {s.cta2Label}
        </Link>
      )}
    </div>
  );
}

function SectionLink({ s }: { s: SectionDTO }) {
  if (!s.ctaLabel) return null;
  return (
    <Link href={safeHref(s.ctaHref)} className={buttonVariants({ variant: "secondary" })}>
      {s.ctaLabel} <ArrowRight />
    </Link>
  );
}

export function HeroSection({ s, animated }: { s: SectionDTO; animated: boolean }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-36 lg:pt-40 lg:pb-28">
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      {animated && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="animate-aurora absolute -top-40 left-[10%] h-[520px] w-[520px] rounded-full bg-brand/20 blur-[120px]" />
          <div className="animate-aurora absolute -top-20 right-[5%] h-[420px] w-[420px] rounded-full bg-brand-2/15 blur-[120px]" style={{ animationDelay: "-6s" }} />
        </div>
      )}
      <Container className="relative grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Reveal hero>
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-2 shadow-[0_0_10px_var(--brand-2)]" />
              {getT()("home.badge")}
            </span>
          </Reveal>
          <Reveal hero delay={0.05}>
            <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              <span className="text-gradient">{s.title}</span>
            </h1>
          </Reveal>
          {s.subtitle && (
            <Reveal hero delay={0.1}>
              <p className="mt-5 text-xl font-semibold leading-snug text-fg/90 sm:text-2xl">{s.subtitle}</p>
            </Reveal>
          )}
          {s.description && (
            <Reveal hero delay={0.15}>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">{s.description}</p>
            </Reveal>
          )}
          <Reveal hero delay={0.2} className="mt-9">
            <CtaButtons s={s} />
          </Reveal>
        </div>
        <Reveal hero delay={0.15}>
          {s.image ? (
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border">
              <Image src={s.image.url} alt={s.image.alt} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            </div>
          ) : (
            <HeroVisual labels={s.list} />
          )}
        </Reveal>
      </Container>
    </section>
  );
}

export function IntroSection({ s }: { s: SectionDTO }) {
  return (
    <section className="py-20 lg:py-28">
      <Container className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          {s.subtitle && <Eyebrow>{s.subtitle}</Eyebrow>}
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{s.title}</h2>
          {s.image && (
            <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl border border-border">
              <Image src={s.image.url} alt={s.image.alt} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
            </div>
          )}
        </Reveal>
        <Reveal delay={0.1}>
          {s.description && <p className="text-lg leading-relaxed text-muted">{s.description}</p>}
          {s.list.length > 0 && (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {s.list.map((item) => (
                <li key={item} className="glass flex items-start gap-3 rounded-xl p-4 text-sm text-fg">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-2" /> {item}
                </li>
              ))}
            </ul>
          )}
          {s.stats.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
              {s.stats.map((st) => (
                <div key={st.label}>
                  <dt className="text-xs text-subtle">{st.label}</dt>
                  <dd className="mt-1 font-display text-3xl font-bold text-brand-gradient">{st.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-8"><SectionLink s={s} /></div>
        </Reveal>
      </Container>
    </section>
  );
}

export async function ServicesSection({ s }: { s: SectionDTO }) {
  const all = await listServices();
  const featured = all.filter((x) => x.isFeatured);
  const list = (featured.length ? featured : all).slice(0, s.limit);
  if (!list.length) return null;
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} action={<SectionLink s={s} />} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((svc, i) => (
            <Reveal key={svc.slug} delay={(i % 3) * 0.06}>
              <OfferingCard href={`/services/${svc.slug}`} title={svc.title} excerpt={svc.excerpt} icon={svc.icon} index={i} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function ItemsGridSection({ s, icons }: { s: SectionDTO; icons: string[] }) {
  if (!s.items.length) return null;
  if (s.image) return <ItemsWithImage s={s} icons={icons} image={s.image} />;
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} align="center" />
        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {s.items.map((it, i) => (
            <Reveal key={it.title} delay={(i % 3) * 0.05} className="h-full">
              <div className="group h-full bg-bg p-8 transition hover:bg-bg-2">
                <DynamicIcon name={icons[i % icons.length]} className="h-6 w-6 text-brand-2 transition group-hover:scale-110" />
                <h3 className="mt-5 text-lg font-semibold text-fg">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{it.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ItemsWithImage({ s, icons, image }: { s: SectionDTO; icons: string[]; image: NonNullable<SectionDTO["image"]> }) {
  return (
    <section className="py-20 lg:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal>
          <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} />
          <div className="relative mt-10 aspect-[6/7] overflow-hidden rounded-3xl border border-border shadow-[0_40px_120px_-40px_var(--brand)]">
            <Image src={image.url} alt={image.alt} fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {s.items.map((it, i) => (
            <Reveal key={it.title} delay={(i % 2) * 0.06} className="h-full">
              <div className="group glass ring-gradient h-full rounded-2xl p-6 transition hover:-translate-y-1 hover:bg-surface-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-brand-2/10 text-brand-2 transition group-hover:from-brand group-hover:to-brand-2 group-hover:text-white">
                  <DynamicIcon name={icons[i % icons.length]} className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-semibold text-fg">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{it.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/** Large featured-work band: image on one side, story + highlights + CTA on the other. */
export function ShowcaseSection({ s }: { s: SectionDTO }) {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-brand/[0.06] to-transparent" aria-hidden />
      <Container className="relative grid items-center gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        {s.image && (
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand/30 via-transparent to-brand-2/20 blur-3xl" aria-hidden />
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border shadow-2xl">
                <Image src={s.image.url} alt={s.image.alt} fill sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" />
              </div>
            </div>
          </Reveal>
        )}
        <Reveal delay={0.1}>
          {s.subtitle && <Eyebrow>{s.subtitle}</Eyebrow>}
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{s.title}</h2>
          {s.description && <p className="mt-5 text-lg leading-relaxed text-muted">{s.description}</p>}
          {s.list.length > 0 && (
            <ul className="mt-8 space-y-3">
              {s.list.map((item) => (
                <li key={item} className="flex items-start gap-3 text-fg">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-2" /> {item}
                </li>
              ))}
            </ul>
          )}
          {s.stats.length > 0 && (
            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
              {s.stats.map((st) => (
                <div key={st.label}>
                  <dt className="text-xs text-subtle">{st.label}</dt>
                  <dd className="mt-1 font-display text-2xl font-bold text-brand-gradient">{st.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-9"><CtaButtons s={s} /></div>
        </Reveal>
      </Container>
    </section>
  );
}

export async function SolutionsSection({ s }: { s: SectionDTO }) {
  const all = await listSolutions();
  const featured = all.filter((x) => x.isFeatured);
  const list = (featured.length ? featured : all).slice(0, s.limit);
  if (!list.length) return null;
  return (
    <section className="relative py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-brand/[0.04] to-transparent" aria-hidden />
      <Container className="relative">
        <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} action={<SectionLink s={s} />} />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {list.map((sol, i) => (
            <Reveal key={sol.slug} delay={(i % 2) * 0.06}>
              <Link href={`/solutions/${sol.slug}`} className="group glass ring-gradient flex items-center gap-5 rounded-2xl p-5 transition hover:bg-surface-2">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-[0_10px_30px_-12px_var(--brand)]">
                  <DynamicIcon name={sol.icon} className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-fg">{sol.title}</span>
                  <span className="mt-1 block text-sm text-muted">{sol.excerpt}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-subtle transition group-hover:translate-x-1 group-hover:text-brand-2" />
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export async function IndustriesSection({ s }: { s: SectionDTO }) {
  const list = await listIndustries();
  if (!list.length) return null;
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} action={<SectionLink s={s} />} />
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((ind, i) => (
            <Reveal key={ind.slug} delay={(i % 5) * 0.04}>
              {ind.cover ? (
                <Link href={`/industries/${ind.slug}`} className="group glass ring-gradient flex h-full flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1">
                  <span className="relative block aspect-[4/3] overflow-hidden">
                    <Image src={ind.cover.url} alt="" fill sizes="(min-width:1024px) 20vw, (min-width:640px) 33vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  </span>
                  <span className="flex items-center gap-2 p-4 text-sm font-semibold text-fg">
                    <DynamicIcon name={ind.icon} className="h-4 w-4 shrink-0 text-brand-2" />
                    {ind.title}
                  </span>
                </Link>
              ) : (
                <Link href={`/industries/${ind.slug}`} className="group glass ring-gradient flex h-full flex-col items-start gap-4 rounded-2xl p-5 transition hover:-translate-y-1 hover:bg-surface-2">
                  <DynamicIcon name={ind.icon} className="h-6 w-6 text-brand-2" />
                  <span className="text-sm font-semibold text-fg">{ind.title}</span>
                </Link>
              )}
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export async function ProjectsSection({ s }: { s: SectionDTO }) {
  const featured = await listProjects({ featured: true, perPage: s.limit });
  const list = featured.items.length ? featured.items : (await listProjects({ perPage: s.limit })).items;
  if (!list.length) return null;
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} action={<SectionLink s={s} />} />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.06}>
              <ProjectCard project={p} index={i} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function ProcessSection({ s }: { s: SectionDTO }) {
  if (!s.items.length) return null;
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} align="center" />
        <div className="relative mt-14">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border-strong to-transparent lg:block" aria-hidden />
          <ol className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {s.items.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 0.08} className="relative">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/30 bg-bg font-display text-lg font-bold text-brand-gradient shadow-[0_0_30px_-12px_var(--brand)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 font-semibold text-fg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

export async function TeamSection({ s }: { s: SectionDTO }) {
  const team = (await listTeam()).slice(0, s.limit);
  if (!team.length) return null;
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} action={<SectionLink s={s} />} />
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {team.map((m) => <TeamCard key={m.slug} member={m} />)}
        </div>
      </Container>
    </section>
  );
}

export async function TestimonialsSection({ s }: { s: SectionDTO }) {
  const items = (await listTestimonials()).slice(0, s.limit);
  if (!items.length) return null;
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} align="center" />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={t.id} delay={(i % 3) * 0.06}>
              <figure className="glass flex h-full flex-col rounded-2xl p-6">
                <Quote className="h-7 w-7 text-brand/60" />
                {t.rating ? (
                  <div className="mt-3 flex gap-0.5" aria-label={getT()("common.outOf5", { n: t.rating })}>
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className={cn("h-4 w-4", k < t.rating! ? "fill-warning text-warning" : "text-border-strong")} />
                    ))}
                  </div>
                ) : null}
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-fg/90">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  {t.avatar ? (
                    <Image src={t.avatar.url} alt={t.avatar.alt || t.authorName} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/15 text-sm font-bold text-brand-2">{t.authorName[0]}</span>
                  )}
                  <span>
                    <span className="block text-sm font-semibold text-fg">{t.authorName}</span>
                    <span className="block text-xs text-muted">{[t.authorTitle, t.company].filter(Boolean).join(", ")}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function TechStackSection({ s }: { s: SectionDTO }) {
  if (!s.items.length) return null;
  const all = s.items.flatMap((g) => g.description.split(",").map((x) => x.trim()).filter(Boolean));
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} align="center" />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.items.map((g) => (
            <div key={g.title} className="glass rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-2">{g.title}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {g.description.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                  <span key={t} className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-fg">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
      {all.length > 6 && (
        <div className="relative mt-14 overflow-hidden mask-radial" aria-hidden>
          <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
            {[...all, ...all].map((t, i) => (
              <span key={i} className="font-display text-2xl font-semibold text-subtle/70">{t}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export async function BlogSection({ s }: { s: SectionDTO }) {
  const { items } = await listPosts({ perPage: s.limit });
  if (!items.length) return null;
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <SectionHeading eyebrow={s.subtitle} title={s.title} description={s.description} action={<SectionLink s={s} />} />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => <PostCard key={p.slug} post={p} index={i} />)}
        </div>
      </Container>
    </section>
  );
}

export function CtaSection({ s }: { s: SectionDTO }) {
  return (
    <section className="py-20 lg:py-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-brand/25 px-6 py-16 text-center sm:px-16">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-deep/60 via-bg-2 to-bg-2" aria-hidden />
            {s.image && <Image src={s.image.url} alt="" fill sizes="100vw" className="object-cover opacity-70" aria-hidden />}
            <div className="bg-grid mask-radial absolute inset-0 opacity-60" aria-hidden />
            <div className="absolute -top-24 left-1/2 h-64 w-[60%] -translate-x-1/2 rounded-full bg-brand/40 blur-[100px]" aria-hidden />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl text-3xl font-bold leading-tight text-fg sm:text-4xl lg:text-5xl">{s.title}</h2>
              {s.description && <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">{s.description}</p>}
              <div className="mt-9"><CtaButtons s={s} center /></div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

export function NewsletterSection({ s }: { s: SectionDTO }) {
  return (
    <section className="py-10">
      <Container>
        <div className="glass flex flex-col items-start gap-6 rounded-3xl p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="max-w-lg">
            <h2 className="text-2xl font-bold text-fg">{s.title}</h2>
            {s.description && <p className="mt-2 text-sm text-muted">{s.description}</p>}
          </div>
          <NewsletterForm source="homepage" className="md:max-w-md" />
        </div>
      </Container>
    </section>
  );
}

/** Renders any CMS section by its type. Unknown types are skipped safely. */
export function RenderSection({ s, animated = true }: { s: SectionDTO; animated?: boolean }) {
  switch (s.type) {
    case "hero": return <HeroSection s={s} animated={animated} />;
    case "intro": return <IntroSection s={s} />;
    case "showcase": return <ShowcaseSection s={s} />;
    case "services": return <ServicesSection s={s} />;
    case "capabilities": return <ItemsGridSection s={s} icons={capabilityIcons} />;
    case "solutions": return <SolutionsSection s={s} />;
    case "industries": return <IndustriesSection s={s} />;
    case "projects": return <ProjectsSection s={s} />;
    case "why": return <ItemsGridSection s={s} icons={whyIcons} />;
    case "process": return <ProcessSection s={s} />;
    case "team": return <TeamSection s={s} />;
    case "testimonials": return <TestimonialsSection s={s} />;
    case "techstack": return <TechStackSection s={s} />;
    case "blog": return <BlogSection s={s} />;
    case "cta": return <CtaSection s={s} />;
    case "newsletter": return <NewsletterSection s={s} />;
    default: return null;
  }
}

export const SECTION_TYPES = [
  "hero", "intro", "showcase", "services", "capabilities", "solutions", "industries", "projects", "why",
  "process", "team", "testimonials", "techstack", "blog", "cta", "newsletter",
] as const;
