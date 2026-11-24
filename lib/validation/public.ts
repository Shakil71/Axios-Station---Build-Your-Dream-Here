import { z } from "zod";

// No runtime code generation: keeps Zod compatible with our CSP (no 'unsafe-eval').
z.config({ jitless: true });

const trimmed = (max: number) => z.string().trim().max(max);

export const contactSchema = z.object({
  name: trimmed(160).min(2, "Please enter your name."),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(191),
  phone: trimmed(40)
    .regex(/^[+()\d\s-]*$/, "Phone may contain digits, spaces, +, ( ) and - only.")
    .optional()
    .or(z.literal("")),
  company: trimmed(191).optional().or(z.literal("")),
  serviceInterest: trimmed(191).optional().or(z.literal("")),
  budgetRange: trimmed(64).optional().or(z.literal("")),
  message: trimmed(5000).min(20, "Please tell us a bit more about your project (at least 20 characters)."),
  preferredContact: z.enum(["EMAIL", "PHONE", "WHATSAPP", "ANY"]).default("EMAIL"),
  consent: z.literal("on", { message: "Please accept the privacy policy so we can contact you." }),
  // Spam protection: honeypot must stay empty; form must not be submitted instantly.
  website: z.string().max(0).optional().or(z.literal("")),
  startedAt: z.coerce.number().int().positive(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(191),
  website: z.string().max(0).optional().or(z.literal("")),
  source: trimmed(120).optional(),
});

export type FormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialFormState: FormState = { ok: false };
