import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Container, Card } from "@/components/ui/primitives";
import { ContactForm } from "@/components/sections/contact-form";
import { FaqList } from "@/components/sections/detail-blocks";
import { SOCIAL_KEYS, SOCIAL_LABELS, SocialIcon } from "@/components/layout/social-icons";
import { getSettings, listGeneralFaqs, listServices } from "@/services/public";
import { buildMetadata } from "@/lib/seo";
import { list, str } from "@/lib/settings-schema";
import { safeHref } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">) {
  const lang = initLocale((await params).lang);
  return buildMetadata("/contact", { title: t(lang, "contact.metaTitle"), description: t(lang, "contact.metaDesc") });
}

export default async function ContactPage({ params, searchParams }: PageProps<"/[lang]/contact">) {
  const lang = initLocale((await params).lang);
  const sp = await searchParams;
  const [settings, services, servicesEn, faqs] = await Promise.all([getSettings(), listServices(), listServices("en"), listGeneralFaqs()]);
  // Option values stay in English so leads read consistently in the admin; labels follow the page language.
  const labelById = new Map(services.map((s) => [s.id, s.title]));
  const serviceOptions = servicesEn.map((s) => ({ value: s.title, label: labelById.get(s.id) ?? s.title }));
  const requested = typeof sp.service === "string" ? sp.service.slice(0, 191) : undefined;
  if (requested && !serviceOptions.some((o) => o.value === requested)) serviceOptions.unshift({ value: requested, label: requested });

  const email = str(settings, "contact.email");
  const phone = str(settings, "contact.phone");
  const whatsapp = str(settings, "contact.whatsapp");
  const address = str(settings, "contact.address");
  const hours = str(settings, "contact.hours");
  const map = str(settings, "contact.mapEmbedUrl");
  const socials = SOCIAL_KEYS.map((k) => ({ key: k, url: str(settings, `social.${k}`) })).filter((s) => s.url);
  const details = [
    email && { Icon: Mail, label: t(lang, "contact.email"), value: email, href: `mailto:${email}` },
    phone && { Icon: Phone, label: t(lang, "contact.phone"), value: phone, href: `tel:${phone.replace(/\s/g, "")}` },
    whatsapp && { Icon: MessageCircle, label: t(lang, "contact.whatsapp"), value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` },
    address && { Icon: MapPin, label: t(lang, "contact.office"), value: address },
    hours && { Icon: Clock, label: t(lang, "contact.hours"), value: hours },
  ].filter(Boolean) as { Icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <PageHero
        eyebrow={t(lang, "contact.eyebrow")}
        title={t(lang, "contact.title")}
        description={t(lang, "contact.desc")}
        crumbs={[{ name: t(lang, "contact.eyebrow"), path: "/contact" }]}
      />
      <section>
        <Container className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <Card className="p-6 sm:p-10">
            <ContactForm services={serviceOptions} budgets={list(settings, "leads.budgetRanges")} defaultService={requested} />
          </Card>
          <aside className="space-y-5">
            {details.length > 0 && (
              <Card className="p-6">
                <h2 className="font-semibold">{t(lang, "contact.details")}</h2>
                <ul className="mt-5 space-y-5">
                  {details.map((d) => (
                    <li key={d.label} className="flex gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-2"><d.Icon className="h-5 w-5" /></span>
                      <span>
                        <span className="block text-xs text-subtle">{d.label}</span>
                        {d.href ? (
                          <a href={d.href} className="whitespace-pre-line text-sm text-fg hover:text-brand-2" target={d.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{d.value}</a>
                        ) : (
                          <span className="whitespace-pre-line text-sm text-fg">{d.value}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {socials.length > 0 && (
              <Card className="p-6">
                <h2 className="font-semibold">{t(lang, "contact.follow")}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <a key={s.key} href={safeHref(s.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-muted hover:text-fg">
                      <SocialIcon name={s.key} /> {SOCIAL_LABELS[s.key]}
                    </a>
                  ))}
                </div>
              </Card>
            )}
            <Card className="p-6">
              <h2 className="font-semibold">{t(lang, "contact.nextTitle")}</h2>
              <ol className="mt-4 space-y-3 text-sm text-muted">
                {(["contact.next1", "contact.next2", "contact.next3"] as const).map((k, i) => (
                  <li key={k}><span className="font-semibold text-fg">{i + 1}.</span> {t(lang, k)}</li>
                ))}
              </ol>
            </Card>
          </aside>
        </Container>
      </section>
      {map.startsWith("https://www.google.com/maps/embed") && (
        <section className="pt-16">
          <Container>
            <iframe src={map} title={t(lang, "contact.map")} className="h-80 w-full rounded-3xl border border-border" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </Container>
        </section>
      )}
      <FaqList faqs={faqs} />
    </>
  );
}
