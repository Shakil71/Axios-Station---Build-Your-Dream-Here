import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

export type MailMessage = { to: string; subject: string; text: string; html?: string; replyTo?: string };

let transporter: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (transporter !== undefined) return transporter;
  if (!env.SMTP_HOST) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

export function isEmailConfigured() {
  return Boolean(env.SMTP_HOST);
}

/**
 * Send an email. Returns { sent: false } (and logs) when SMTP is not
 * configured, so callers never pretend an email went out.
 */
export async function sendMail(msg: MailMessage): Promise<{ sent: boolean; error?: string }> {
  const t = getTransport();
  if (!t) {
    console.info(`[email] SMTP not configured — skipped "${msg.subject}" to ${msg.to}`);
    return { sent: false, error: "SMTP is not configured" };
  }
  try {
    await t.sendMail({ from: env.MAIL_FROM, ...msg });
    return { sent: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown email error";
    console.error("[email] send failed:", error);
    return { sent: false, error };
  }
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
