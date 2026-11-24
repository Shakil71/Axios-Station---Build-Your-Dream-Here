import { redirect } from "next/navigation";
import { AuthCard } from "../auth-card";
import { LoginForm } from "@/components/admin/auth-forms";
import { getCurrentUser } from "@/lib/auth/guard";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser().catch(() => null)) redirect("/admin");
  return (
    <AuthCard title="Admin sign in" description="Axios Station content management">
      <LoginForm />
    </AuthCard>
  );
}
