"use client";

import { buttonVariants } from "@/components/ui/button";
import { LocaleLink, useT } from "@/components/i18n/locale-provider";

/** 404 inside the public site (keeps the header, footer and the visitor's language). */
export default function LocalizedNotFound() {
  const t = useT();
  return (
    <section className="relative flex min-h-[70dvh] items-center justify-center overflow-hidden px-4 pt-32 pb-16">
      <div className="bg-grid mask-radial absolute inset-0 opacity-70" aria-hidden />
      <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/25 blur-[100px]" aria-hidden />
      <div className="relative text-center">
        <p className="font-display text-8xl font-extrabold text-brand-gradient">404</p>
        <h1 className="mt-4 text-2xl font-bold">{t("notFound.title")}</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">{t("notFound.text")}</p>
        <div className="mt-8 flex justify-center gap-3">
          <LocaleLink href="/" className={buttonVariants()}>{t("notFound.home")}</LocaleLink>
          <LocaleLink href="/contact" className={buttonVariants({ variant: "secondary" })}>{t("notFound.contact")}</LocaleLink>
        </div>
      </div>
    </section>
  );
}
