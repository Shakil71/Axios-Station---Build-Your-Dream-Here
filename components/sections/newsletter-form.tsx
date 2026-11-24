"use client";

import { useActionState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/actions/public";
import { initialFormState } from "@/lib/validation/public";
import { cn } from "@/lib/utils";
import { useLocale, useT } from "@/components/i18n/locale-provider";

export function NewsletterForm({ source = "website", className }: { source?: string; className?: string }) {
  const [state, action, pending] = useActionState(subscribeNewsletter, initialFormState);
  const t = useT();
  const lang = useLocale();

  if (state.ok) {
    return (
      <p className={cn("flex items-center gap-2 text-sm text-success", className)} role="status">
        <CheckCircle2 className="h-4 w-4" /> {state.message}
      </p>
    );
  }

  return (
    <form action={action} className={cn("w-full", className)} noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={`nl-${source}`} className="sr-only">{t("newsletter.emailLabel")}</label>
        <input
          id={`nl-${source}`}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border-strong bg-bg-2/70 px-4 text-sm text-fg placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <input type="hidden" name="source" value={source} />
        <input type="hidden" name="lang" value={lang} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60 cursor-pointer"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t("newsletter.subscribe")} <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
      {state.message && !state.ok && <p className="mt-2 text-xs text-danger" role="alert">{state.message}</p>}
    </form>
  );
}
