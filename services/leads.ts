import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { escapeHtml, sendMail } from "@/lib/email";
import { env } from "@/lib/env";
import { siteUrl } from "@/lib/utils";
import type { ContactInput } from "@/lib/validation/public";

export async function createInquiry(input: ContactInput, meta: { ipHash: string; userAgent: string; source?: string }) {
  const inquiry = await prisma.contactInquiry.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company: input.company || null,
      serviceInterest: input.serviceInterest || null,
      budgetRange: input.budgetRange || null,
      message: input.message,
      preferredContact: input.preferredContact,
      consentAt: new Date(),
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      source: meta.source ?? "contact-form",
    },
  });

  // Notify the sales inbox. Failure to email never loses the lead — it's already stored.
  if (env.LEAD_NOTIFICATION_EMAIL) {
    const rows: [string, string][] = [
      ["Name", input.name],
      ["Email", input.email],
      ["Phone", input.phone || "—"],
      ["Company", input.company || "—"],
      ["Service", input.serviceInterest || "—"],
      ["Budget", input.budgetRange || "—"],
      ["Preferred contact", input.preferredContact],
    ];
    await sendMail({
      to: env.LEAD_NOTIFICATION_EMAIL,
      replyTo: input.email,
      subject: `New inquiry: ${input.name}${input.company ? ` (${input.company})` : ""}`,
      text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${input.message}\n\nOpen: ${siteUrl(`/admin/leads/${inquiry.id}`)}`,
      html:
        `<table>${rows.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`).join("")}</table>` +
        `<p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>` +
        `<p><a href="${siteUrl(`/admin/leads/${inquiry.id}`)}">Open in admin</a></p>`,
    });
  }

  // Acknowledge the visitor.
  await sendMail({
    to: input.email,
    subject: "We received your message — Axios Station",
    text: `Hi ${input.name},\n\nThank you for contacting Axios Station. Our team will review your message and get back to you soon.\n\n— Axios Station`,
  });

  return inquiry;
}

export async function subscribe(email: string, source?: string): Promise<"subscribed" | "already" | "resubscribed"> {
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing?.status === "SUBSCRIBED") return "already";
  if (existing) {
    await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: { status: "SUBSCRIBED", unsubscribedAt: null, consentAt: new Date() },
    });
    return "resubscribed";
  }
  await prisma.newsletterSubscriber.create({
    data: { email, source: source ?? "website", consentAt: new Date(), unsubscribeToken: randomBytes(24).toString("hex") },
  });
  return "subscribed";
}

export async function unsubscribe(token: string): Promise<boolean> {
  if (!/^[a-f0-9]{48}$/.test(token)) return false;
  const res = await prisma.newsletterSubscriber.updateMany({
    where: { unsubscribeToken: token, status: "SUBSCRIBED" },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  });
  return res.count > 0;
}
