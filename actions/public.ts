"use server";

import { z } from "zod";
import { contactSchema, newsletterSchema, type FormState } from "@/lib/validation/public";
import { rateLimit, limits } from "@/lib/security/rate-limit";
import { getClientIp, getUserAgent, hashIp } from "@/lib/security/request";
import { createInquiry, subscribe } from "@/services/leads";
import { logActivity } from "@/lib/db/activity";
import { isLocale, translator, type DictKey } from "@/lib/i18n";

/** Language of the submitting page (hidden "lang" field); defaults to English. */
function formT(formData: FormData) {
  const l = formData.get("lang");
  return translator(typeof l === "string" && isLocale(l) ? l : "en");
}

/** Field errors in the visitor's language (the schema's own messages are English). */
function localErrors(fieldErrors: Record<string, string[] | undefined>, t: ReturnType<typeof formT>) {
  const out: Record<string, string[]> = {};
  for (const [field, errs] of Object.entries(fieldErrors)) {
    if (!errs?.length) continue;
    const key = `form.err.${field}` as DictKey;
    const msg = t(key);
    out[field] = [msg === key ? t("form.err.generic") : msg];
  }
  return out;
}

const MIN_FILL_MS = 2500;

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = formT(formData);
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: t("form.fixFields"), fieldErrors: localErrors(z.flattenError(parsed.error).fieldErrors, t) };
  }
  const data = parsed.data;

  // Bots: filled honeypot or impossibly fast submission → pretend success, store nothing.
  if (data.website || Date.now() - data.startedAt < MIN_FILL_MS) {
    return { ok: true, message: t("form.thanks") };
  }

  const ip = await getClientIp();
  const rl = await rateLimit("contact", ip, limits.contact.limit, limits.contact.windowSec);
  if (!rl.allowed) {
    return { ok: false, message: t("form.tooMany", { n: Math.ceil(rl.retryAfterSec / 60) }) };
  }

  try {
    const inquiry = await createInquiry(data, { ipHash: hashIp(ip), userAgent: await getUserAgent() });
    await logActivity({ action: "create", entityType: "lead", entityId: inquiry.id, summary: `New inquiry from ${data.name}` });
    return { ok: true, message: t("form.thanks") };
  } catch (e) {
    console.error("[contact] failed", e instanceof Error ? e.message : e);
    return { ok: false, message: t("form.failed") };
  }
}

export async function subscribeNewsletter(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = formT(formData);
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: t("newsletter.invalid"), fieldErrors: localErrors(z.flattenError(parsed.error).fieldErrors, t) };
  }
  if (parsed.data.website) return { ok: true, message: t("newsletter.subscribed") };

  const ip = await getClientIp();
  const rl = await rateLimit("newsletter", ip, limits.newsletter.limit, limits.newsletter.windowSec);
  if (!rl.allowed) return { ok: false, message: t("newsletter.tooMany") };

  try {
    const result = await subscribe(parsed.data.email, parsed.data.source);
    return {
      ok: true,
      message: result === "already" ? t("newsletter.already") : t("newsletter.subscribed"),
    };
  } catch (e) {
    console.error("[newsletter] failed", e instanceof Error ? e.message : e);
    return { ok: false, message: t("newsletter.failed") };
  }
}
