import "server-only";
import { ForbiddenError } from "@/lib/auth/guard";

export type Result = { ok: boolean; message?: string; fieldErrors?: Record<string, string[] | undefined>; id?: string };

/** Wrap a server action so permission failures and unexpected errors return a safe message. */
export async function guarded(fn: () => Promise<Result>): Promise<Result> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ForbiddenError) return { ok: false, message: e.message };
    // Let Next.js redirect()/notFound() propagate.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_")) throw e;
    console.error("[admin action]", e);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
