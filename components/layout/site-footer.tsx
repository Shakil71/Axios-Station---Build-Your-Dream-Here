import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { Logo } from "./logo";
import { SOCIAL_KEYS, SOCIAL_LABELS, SocialIcon } from "./social-icons";
import { NewsletterForm } from "@/components/sections/newsletter-form";
import { getNavigation, getSettings } from "@/services/public";
import { str } from "@/lib/settings-schema";
import { safeHref } from "@/lib/utils";
import { CookieSettingsButton } from "./analytics";
import { LocaleLink as Link } from "@/components/i18n/locale-provider";
import { getT } from "@/lib/i18n/server";

const FOOTER_NAVS = ["footer-company", "footer-services", "footer-solutions"];

export async function SiteFooter() {
  const [settings, legal, ...navs] = await Promise.all([
    getSettings(),
    getNavigation("footer-legal"),
    ...FOOTER_NAVS.map((k) => getNavigation(k)),
  ]);
  const name = str(settings, "site.name") || "Axios Station";
  const t = getT();
  const email = str(settings, "contact.email");
  const phone = str(settings, "contact.phone");
  const address = str(settings, "contact.address");
  const socials = SOCIAL_KEYS.map((k) => ({ key: k, url: str(settings, `social.${k}`) })).filter((s) => s.url);

  return (
    <footer className="relative mt-24 border-t border-border bg-bg-2/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo name={name} />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">{str(settings, "footer.about")}</p>
            <ul className="mt-6 space-y-2.5 text-sm text-muted">
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="inline-flex items-center gap-2.5 hover:text-fg">
                    <Mail className="h-4 w-4 text-brand-2" /> {email}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2.5 hover:text-fg">
                    <Phone className="h-4 w-4 text-brand-2" /> {phone}
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-2" /> <span className="whitespace-pre-line">{address}</span>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="mt-6 flex gap-2">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={safeHref(s.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABELS[s.key]}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition hover:border-brand/50 hover:text-fg"
                  >
                    <SocialIcon name={s.key} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            {navs.map((nav, i) =>
              nav.items.length ? (
                <div key={FOOTER_NAVS[i]}>
                  <p className="text-sm font-semibold text-fg">{nav.name}</p>
                  <ul className="mt-4 space-y-2.5">
                    {nav.items.map((it) => (
                      <li key={it.id}>
                        <Link href={safeHref(it.href)} className="text-sm text-muted transition hover:text-fg">
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </div>

          <div className="lg:col-span-3">
            <p className="text-sm font-semibold text-fg">{t("footer.newsletterTitle")}</p>
            <p className="mt-2 text-sm text-muted">{t("footer.newsletterText")}</p>
            <NewsletterForm source="footer" className="mt-4" />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {str(settings, "footer.copyright") || name}. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.items.map((it) => (
              <Link key={it.id} href={safeHref(it.href)} className="hover:text-fg">
                {it.label}
              </Link>
            ))}
            {/^G-[A-Z0-9]{4,20}$/.test(str(settings, "analytics.gaMeasurementId")) && <CookieSettingsButton />}
          </div>
        </div>
      </Container>
    </footer>
  );
}
