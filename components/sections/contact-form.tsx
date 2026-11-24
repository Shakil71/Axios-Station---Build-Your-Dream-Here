"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitContact } from "@/actions/public";
import { initialFormState } from "@/lib/validation/public";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { LocaleLink, useLocale, useT } from "@/components/i18n/locale-provider";

export function ContactForm({ services, budgets, defaultService }: { services: { value: string; label: string }[]; budgets: string[]; defaultService?: string }) {
  const [state, action, pending] = useActionState(submitContact, initialFormState);
  const [startedAt] = useState(() => Date.now());
  const e = state.fieldErrors ?? {};
  const t = useT();
  const lang = useLocale();

  if (state.ok) {
    return (
      <div className="flex flex-col items-center py-16 text-center" role="status">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h2 className="mt-6 text-2xl font-bold">{t("form.received")}</h2>
        <p className="mt-2 max-w-sm text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="lang" value={lang} />
      <div className="absolute -left-[9999px]" aria-hidden>
        <label>Website <input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">{t("form.name")} *</Label>
          <Input id="name" name="name" required autoComplete="name" aria-invalid={!!e.name} />
          <FieldError>{e.name?.[0]}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">{t("form.email")} *</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" aria-invalid={!!e.email} />
          <FieldError>{e.email?.[0]}</FieldError>
        </div>
        <div>
          <Label htmlFor="phone">{t("form.phone")}</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" aria-invalid={!!e.phone} />
          <FieldError>{e.phone?.[0]}</FieldError>
        </div>
        <div>
          <Label htmlFor="company">{t("form.company")}</Label>
          <Input id="company" name="company" autoComplete="organization" />
        </div>
        <div>
          <Label htmlFor="serviceInterest">{t("form.service")}</Label>
          <Select id="serviceInterest" name="serviceInterest" defaultValue={defaultService ?? ""}>
            <option value="">{t("form.selectService")}</option>
            {services.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            <option value="Other">{t("form.otherService")}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="budgetRange">{t("form.budget")}</Label>
          <Select id="budgetRange" name="budgetRange" defaultValue="">
            <option value="">{t("form.preferNot")}</option>
            {budgets.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="message">{t("form.message")} *</Label>
        <Textarea id="message" name="message" rows={6} required placeholder={t("form.messagePlaceholder")} aria-invalid={!!e.message} />
        <FieldError>{e.message?.[0]}</FieldError>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">{t("form.preferred")}</legend>
        <div className="flex flex-wrap gap-2">
          {[["EMAIL", t("contact.email")], ["PHONE", t("contact.phone")], ["WHATSAPP", t("contact.whatsapp")], ["ANY", t("form.any")]].map(([v, l], i) => (
            <label key={v} className="cursor-pointer">
              <input type="radio" name="preferredContact" value={v} defaultChecked={i === 0} className="peer sr-only" />
              <span className="inline-flex rounded-xl border border-border px-4 py-2 text-sm text-muted transition peer-checked:border-brand peer-checked:bg-brand/15 peer-checked:text-fg peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                {l}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 rounded accent-[var(--brand)]" aria-invalid={!!e.consent} />
          <span>
            {t("form.consent")}{" "}
            <LocaleLink href="/privacy" className="text-brand-2 underline" target="_blank">{t("form.privacy")}</LocaleLink>. *
          </span>
        </label>
        <FieldError>{e.consent?.[0]}</FieldError>
      </div>

      {state.message && !state.ok && <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{state.message}</p>}

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending ? <><Loader2 className="animate-spin" /> {t("form.sending")}</> : <>{t("form.send")} <Send /></>}
      </Button>
    </form>
  );
}
