import { str, type SettingsMap } from "@/lib/settings-schema";
import { SOCIAL_KEYS } from "@/components/layout/social-icons";
import { siteUrl } from "@/lib/utils";
import type { TeamMemberDTO } from "@/components/sections/cards";
import { getLocale } from "@/lib/i18n/server";

const DEFAULT_OG = "/images/brand/og-default.png";

/** Serialise JSON-LD safely (prevents </script> injection from CMS content). */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

/** Stable ids so every page's structured data points at the same company and website. */
export const ORG_ID = () => siteUrl("/#organization");
export const WEBSITE_ID = () => siteUrl("/#website");

/**
 * Company + website graph, on every public page. Address and phone appear only
 * once they are filled in (Admin → Contact Information); then the company is
 * also described as a ProfessionalService (a local business), which helps
 * Google Maps / local results.
 */
export function OrganizationJsonLd({ settings, services = [] }: { settings: SettingsMap; services?: string[] }) {
  const sameAs = SOCIAL_KEYS.map((k) => str(settings, `social.${k}`)).filter(Boolean);
  const name = str(settings, "site.name") || "Axios Station";
  const email = str(settings, "contact.email");
  const phone = str(settings, "contact.phone");
  const address = str(settings, "contact.address");
  const hours = str(settings, "contact.hours");
  const year = str(settings, "site.foundingYear");
  const lang = getLocale();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": address ? ["Organization", "ProfessionalService"] : "Organization",
            "@id": ORG_ID(),
            name,
            url: siteUrl("/"),
            logo: { "@type": "ImageObject", url: siteUrl("/images/brand/axios-mark.png"), width: 512, height: 258 },
            image: siteUrl(DEFAULT_OG),
            description: str(settings, "site.description"),
            slogan: str(settings, "site.tagline"),
            ...(/^\d{4}$/.test(year) ? { foundingDate: year } : {}),
            areaServed: [{ "@type": "Country", name: "Bangladesh" }, "Worldwide"],
            ...(services.length ? { knowsAbout: services } : {}),
            ...(sameAs.length ? { sameAs } : {}),
            ...(email || phone
              ? {
                  contactPoint: [
                    {
                      "@type": "ContactPoint",
                      contactType: "sales",
                      availableLanguage: ["English", "Bengali"],
                      ...(email ? { email } : {}),
                      ...(phone ? { telephone: phone } : {}),
                    },
                  ],
                }
              : {}),
            ...(address
              ? {
                  address: { "@type": "PostalAddress", streetAddress: address.replace(/\s*\n\s*/g, ", "), addressCountry: "BD" },
                  ...(phone ? { telephone: phone } : {}),
                  ...(hours ? { openingHours: hours } : {}),
                }
              : {}),
          },
          {
            "@type": "WebSite",
            "@id": WEBSITE_ID(),
            url: siteUrl("/"),
            name,
            inLanguage: lang === "bn" ? "bn-BD" : "en",
            publisher: { "@id": ORG_ID() },
          },
        ],
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: siteUrl(it.path) })),
      }}
    />
  );
}

export function ServiceJsonLd({ name, description, path, image }: { name: string; description: string; path: string; image?: string | null }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        serviceType: name,
        description,
        url: siteUrl(path),
        inLanguage: getLocale() === "bn" ? "bn-BD" : "en",
        ...(image ? { image: image.startsWith("http") ? image : siteUrl(image) } : {}),
        areaServed: [{ "@type": "Country", name: "Bangladesh" }, "Worldwide"],
        provider: { "@id": ORG_ID() },
      }}
    />
  );
}

export function ArticleJsonLd(p: { title: string; description: string; path: string; image?: string | null; publishedAt?: string | null; updatedAt: string; author?: string | null; tags?: string[]; section?: string | null }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: p.title,
        description: p.description,
        mainEntityOfPage: siteUrl(p.path),
        inLanguage: getLocale() === "bn" ? "bn-BD" : "en",
        isPartOf: { "@id": WEBSITE_ID() },
        ...(p.tags?.length ? { keywords: p.tags.join(", ") } : {}),
        ...(p.section ? { articleSection: p.section } : {}),
        ...(p.image ? { image: [p.image.startsWith("http") ? p.image : siteUrl(p.image)] } : {}),
        ...(p.publishedAt ? { datePublished: p.publishedAt } : {}),
        dateModified: p.updatedAt,
        author: p.author ? { "@type": "Person", name: p.author } : { "@id": ORG_ID() },
        publisher: { "@id": ORG_ID() },
      }}
    />
  );
}

export function FaqJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  if (!faqs.length) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
      }}
    />
  );
}

/** Team members as schema.org Person entries (contact details only when the member opted in). */
export function TeamJsonLd({ members }: { members: TeamMemberDTO[] }) {
  if (members.length === 0) return null;
  const org = { "@id": ORG_ID() };
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": members.map((m) => {
          const sameAs = [m.linkedinUrl, m.facebookUrl, m.instagramUrl, m.githubUrl, m.twitterUrl, m.websiteUrl].filter(Boolean);
          return {
            "@type": "Person",
            name: m.name,
            jobTitle: m.position,
            worksFor: org,
            ...(m.photo ? { image: m.photo.url.startsWith("http") ? m.photo.url : siteUrl(m.photo.url) } : {}),
            ...(m.skills.length ? { knowsAbout: m.skills } : {}),
            ...(sameAs.length ? { sameAs } : {}),
            ...(m.email ? { email: m.email } : {}),
          };
        }),
      }}
    />
  );
}
