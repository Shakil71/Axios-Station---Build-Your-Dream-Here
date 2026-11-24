import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ToastProvider } from "@/components/admin/toast";
import { can, getCurrentUser } from "@/lib/auth/guard";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { logoutAction } from "@/actions/admin/auth";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const nav = ADMIN_NAV.map((g) => ({
    title: g.title,
    items: g.items.filter((i) => can(user, i.permission)).map(({ label, href, icon }) => ({ label, href, icon })),
  })).filter((g) => g.items.length);
  return (
    <ToastProvider>
      <AdminShell nav={nav} user={{ name: user.name, email: user.email, roles: user.roles.map((r) => r.name) }} signOutAction={logoutAction}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
