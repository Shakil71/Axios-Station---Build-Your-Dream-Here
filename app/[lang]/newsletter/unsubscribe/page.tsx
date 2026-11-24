import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { unsubscribe } from "@/services/leads";
import { LocaleLink } from "@/components/i18n/locale-provider";
import { t } from "@/lib/i18n";
import { initLocale } from "@/lib/i18n/server";

export const metadata = { title: "Unsubscribe", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function UnsubscribePage({ params, searchParams }: PageProps<"/[lang]/newsletter/unsubscribe">) {
  const lang = initLocale((await params).lang);
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const ok = token ? await unsubscribe(token).catch(() => false) : false;
  return (
    <>
      <PageHero
        title={ok ? t(lang, "unsub.ok") : t(lang, "unsub.bad")}
        description={ok ? t(lang, "unsub.okText") : t(lang, "unsub.badText")}
        crumbs={[{ name: t(lang, "unsub.title"), path: "/newsletter/unsubscribe" }]}
      />
      <Container>
        <LocaleLink href="/" className={buttonVariants({ variant: "secondary" })}>{t(lang, "unsub.back")}</LocaleLink>
      </Container>
    </>
  );
}
