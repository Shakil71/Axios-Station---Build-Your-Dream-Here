"use server";

import { createHash, randomBytes } from "node:crypto";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, passwordPolicyError } from "@/lib/security/password";
import { rateLimit, limits } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/request";
import { sendMail } from "@/lib/email";
import { logActivity } from "@/lib/db/activity";
import { siteUrl } from "@/lib/utils";

export type AuthState = { ok: boolean; message?: string };

export async function loginAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Enter your email and password." };
  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) {
      const code = (e as AuthError & { code?: string }).code;
      if (code === "rate_limited") return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." };
      if (code === "locked") return { ok: false, message: "This account is temporarily locked after repeated failed attempts. Try again in 15 minutes." };
      // CredentialsSignin = wrong email/password. Anything else (e.g. DB down) is an infrastructure error.
      if (e.type !== "CredentialsSignin") return { ok: false, message: "Sign-in is temporarily unavailable. Please try again shortly." };
      return { ok: false, message: "Invalid email or password." };
    }
    throw e; // NEXT_REDIRECT on success
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export async function requestPasswordResetAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const generic: AuthState = { ok: true, message: "If an account exists for that email, a reset link has been sent." };
  const parsed = z.string().trim().toLowerCase().email().max(191).safeParse(form.get("email"));
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };
  const ip = await getClientIp();
  const rl = await rateLimit("pwreset", `${ip}:${parsed.data}`, limits.passwordReset.limit, limits.passwordReset.windowSec);
  if (!rl.allowed) return generic;

  const user = await prisma.user.findFirst({ where: { email: parsed.data, deletedAt: null, isActive: true } });
  if (!user) return generic;

  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * 60_000) } }),
  ]);
  const link = siteUrl(`/admin/reset-password?token=${token}`);
  const sent = await sendMail({
    to: user.email,
    subject: "Reset your Axios Station admin password",
    text: `A password reset was requested for your account.\n\nReset link (valid for 30 minutes):\n${link}\n\nIf you did not request this, ignore this email.`,
  });
  await logActivity({ userId: user.id, action: "password_reset_requested", entityType: "auth", ip, summary: sent.sent ? "Reset email sent" : "Reset requested but SMTP not configured" });
  return generic;
}

export async function resetPasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (!/^[a-f0-9]{64}$/.test(token)) return { ok: false, message: "This reset link is invalid." };
  if (password !== confirm) return { ok: false, message: "Passwords do not match." };
  const policy = passwordPolicyError(password);
  if (policy) return { ok: false, message: policy };

  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return { ok: false, message: "This reset link has expired. Request a new one." };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(password), sessionVersion: { increment: 1 }, failedLoginCount: 0, lockedUntil: null },
    }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId, id: { not: row.id } } }),
  ]);
  await logActivity({ userId: row.userId, action: "password_reset", entityType: "auth", summary: "Password reset via email link" });
  return { ok: true, message: "Your password has been updated. You can now sign in." };
}
