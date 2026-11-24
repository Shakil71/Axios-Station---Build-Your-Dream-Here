import { getPage, getSettings, type SectionDTO } from "@/services/public";
import { RenderSection } from "@/components/sections/home-sections";
import { buildMetadata } from "@/lib/seo";
import { bool } from "@/lib/settings-schema";
import { homepageSections } from "@/lib/content/defaults";
import { initLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]">) {
  const lang = initLocale((await params).lang);
  // English: Admin → SEO entry for "/" wins; this is the fallback. Bengali uses the dictionary.
  return buildMetadata("/", { title: t(lang, "home.metaTitle"), description: t(lang, "home.metaDesc") });
}

/** Default sections are used only if the CMS homepage record is missing (fresh install / DB unavailable). */
function fallbackSections(): SectionDTO[] {
  return homepageSections.map((s, i) => {
    const d = (s.data ?? {}) as { items?: { title: string; description: string }[]; list?: string[]; limit?: number };
    return {
      id: `fallback-${i}`,
      type: s.type,
      title: s.title ?? null,
      subtitle: s.subtitle ?? null,
      description: s.description ?? null,
      ctaLabel: s.ctaLabel ?? null,
      ctaHref: s.ctaHref ?? null,
      cta2Label: s.cta2Label ?? null,
      cta2Href: s.cta2Href ?? null,
      image: null,
      items: d.items ?? [],
      list: d.list ?? [],
      stats: [],
      limit: d.limit ?? 6,
    };
  });
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  initLocale((await params).lang);
  const [page, settings] = await Promise.all([getPage("home"), getSettings()]);
  const sections = page?.sections ?? fallbackSections();
  const animated = bool(settings, "theme.animatedBackground");
  return (
    <>
      {sections.map((s) => (
        <RenderSection key={s.id} s={s} animated={animated} />
      ))}
    </>
  );
}
