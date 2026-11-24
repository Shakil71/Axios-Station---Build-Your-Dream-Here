import "server-only";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { dummyHash, verifyPassword } from "@/lib/security/password";
import { rateLimit, resetRateLimit, limits } from "@/lib/security/rate-limit";
import { isProd } from "@/lib/env";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}
class Locked extends CredentialsSignin {
  code = "locked";
}

const credsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(191),
  password: z.string().min(1).max(128),
});

function ipFrom(req: Request | undefined): string {
  const h = req?.headers;
  return h?.get("x-real-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60, updateAge: 30 * 60 },
  pages: { signIn: "/admin/login", error: "/admin/login" },
  trustHost: true,
  useSecureCookies: isProd,
  providers: [
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      async authorize(raw, request) {
        const parsed = credsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const ip = ipFrom(request);

        const byIp = await rateLimit("login-ip", ip, limits.login.limit * 4, limits.login.windowSec);
        const byEmail = await rateLimit("login-email", email, limits.login.limit, limits.login.windowSec);
        if (!byIp.allowed || !byEmail.allowed) {
          await prisma.loginAttempt.create({ data: { email, ip, success: false, reason: "rate_limited" } }).catch(() => {});
          throw new RateLimited();
        }

        const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
        if (!user) {
          await verifyPassword(password, await dummyHash());
          await prisma.loginAttempt.create({ data: { email, ip, success: false, reason: "unknown_user" } }).catch(() => {});
          return null;
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await prisma.loginAttempt.create({ data: { email, ip, success: false, reason: "locked" } }).catch(() => {});
          throw new Locked();
        }
        const ok = user.isActive && (await verifyPassword(password, user.passwordHash));
        if (!ok) {
          const failed = user.failedLoginCount + 1;
          await prisma.$transaction([
            prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginCount: failed >= MAX_FAILED ? 0 : failed,
                lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : user.lockedUntil,
              },
            }),
            prisma.loginAttempt.create({ data: { email, ip, success: false, reason: user.isActive ? "bad_password" : "inactive" } }),
          ]);
          return null;
        }
        // Only failed attempts should count towards the per-account limit.
        await resetRateLimit("login-email", email);
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip },
          }),
          prisma.loginAttempt.create({ data: { email, ip, success: true } }),
          prisma.activityLog.create({ data: { userId: user.id, action: "login", entityType: "auth", summary: "Signed in", ip } }),
        ]);
        return { id: user.id, name: user.name, email: user.email, sv: user.sessionVersion };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.sv = (user as { sv?: number }).sv ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.uid === "string") session.user.id = token.uid;
      (session as unknown as { sv: number }).sv = typeof token.sv === "number" ? token.sv : 0;
      return session;
    },
  },
});
