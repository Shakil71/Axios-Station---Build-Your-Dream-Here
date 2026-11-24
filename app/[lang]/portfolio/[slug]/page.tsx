import { notFound } from "next/navigation";
import Image from "next/image";
import { ExternalLink, Info } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Container, Badge } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { CoverArt } from "@/components/ui/cover-art";
import { ConsultationCta } from "@/components/sections/detail-blocks";
import { getProject, listProjects } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { sanitizeRichText } from "@/lib/security/sanitize";
import { safeHref } from "@/lib/utils";
import { LocaleLink } from "@/components/i18n/locale-provider";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listProjects({ perPage: 48 }, "en")).items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/portfolio/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const p = await getProject(slug);
  if (!p) return { title: t(lang, "project.notFound") };
  return buildMetadata(`/portfolio/${slug}`, { title: p.title, description: p.summary, image: p.cover?.url });
}

export default async function ProjectPage({ params }: PageProps<"/[lang]/portfolio/[slug]">) {
  const { lang: l, slug } = await params;
  const lang = initLocale(l);
  const p = await getProject(slug);
  if (!p) notFound();

  const blocks = [
    { title: t(lang, "project.challenge"), body: p.challenges },
    { title: t(lang, "project.solution"), body: p.solutions },
    { title: t(lang, "project.results"), body: p.results },
  ].filter((b) => b.body);

  return (
    <>
      <PageHero eyebrow={p.category?.name ?? t(lang, "project.project")} title={p.title} description={p.summary} crumbs={[{ name: t(lang, "portfolio.eyebrow"), path: "/portfolio" }, { name: p.title, path: `/portfolio/${p.slug}` }]}>
        <div className="flex flex-wrap items-center gap-2">
          {p.isDemo && <Badge tone="warning"><Info className="h-3 w-3" /> {t(lang, "project.demo")}</Badge>}
          {p.industry && (
            <LocaleLink href={`/industries/${p.industry.slug}`}><Badge tone="brand">{p.industry.title}</Badge></LocaleLink>
          )}
          {p.clientName && <Badge tone="muted">{t(lang, "project.client", { x: p.clientName })}</Badge>}
        </div>
      </PageHero>

      <section className="pb-8">
        <Container>
          <CoverArt media={p.cover} icon="Layers" alt={p.title} priority className="aspect-[16/9] rounded-3xl border border-border shadow-card" sizes="(min-width:1280px) 1200px, 100vw" />
        </Container>
      </section>

      <section className="py-12">
        <Container className="grid gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            {p.description && <div className="prose-axs" dangerouslySetInnerHTML={{ __html: sanitizeRichText(p.description) }} />}
            <div className="mt-10 grid gap-5">
              {blocks.map((b) => (
                <div key={b.title} className="glass rounded-2xl p-6">
                  <h2 className="text-lg font-bold">{b.title}</h2>
                  <p className="mt-2 whitespace-pre-line leading-relaxed text-muted">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            {p.technologies.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-fg">{t(lang, "common.technologies")}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.technologies.map((t) => <Badge key={t} tone="muted">{t}</Badge>)}
                </div>
              </div>
            )}
            {p.projectUrl && (
              <a href={safeHref(p.projectUrl)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", className: "w-full" })}>
                {t(lang, "project.visit")} <ExternalLink />
              </a>
            )}
          </aside>
        </Container>
      </section>

      {p.gallery.length > 0 && (
        <section className="py-12">
          <Container>
            <h2 className="text-2xl font-bold">{t(lang, "project.gallery")}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {p.gallery.map((g) => (
                <figure key={g.url} className="overflow-hidden rounded-2xl border border-border">
                  <div className="relative aspect-[16/10]">
                    <Image src={g.url} alt={g.alt || g.caption || p.title} fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover" />
                  </div>
                  {g.caption && <figcaption className="px-4 py-3 text-sm text-muted">{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </Container>
        </section>
      )}
      <ConsultationCta />
    </>
  );
}
