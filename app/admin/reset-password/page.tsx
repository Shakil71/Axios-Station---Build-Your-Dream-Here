import Link from "next/link";
import { AuthCard } from "../auth-card";
import { ForgotPasswordForm, ResetPasswordForm } from "@/components/admin/auth-forms";

export const metadata = { title: "Reset password", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/admin/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return (
    <AuthCard
      title={token ? "Choose a new password" : "Reset your password"}
      description={token ? "Your new password will sign you out of all other sessions." : "We'll email you a secure link valid for 30 minutes."}
    >
      {token ? <ResetPasswordForm token={token} /> : <ForgotPasswordForm />}
      <Link href="/admin/login" className="mt-6 block text-center text-sm text-muted hover:text-fg">Back to sign in</Link>
    </AuthCard>
  );
}
