import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { UserForm, UserOps } from "@/components/admin/module-forms";

export default async function UserEditPage({ params }: PageProps<"/admin/users/[id]">) {
  const actor = await requirePagePermission("users.manage");
  const { id } = await params;
  const isNew = id === "new";
  const [user, roles] = await Promise.all([
    isNew ? null : prisma.user.findFirst({ where: { id, deletedAt: null }, include: { roles: true } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!isNew && !user) notFound();
  const recent = user ? await prisma.loginAttempt.findMany({ where: { email: user.email }, orderBy: { createdAt: "desc" }, take: 10 }) : [];
  const actorIsSuper = actor.roles.some((r) => r.key === "super_admin");
  const assignable = roles.filter((r) => actorIsSuper || r.key !== "super_admin");

  return (
    <>
      <AdminPageHeader title={user?.name ?? "New user"} back={{ href: "/admin/users", label: "Users" }} actions={user && user.id !== actor.id ? <UserOps id={user.id} /> : undefined} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <UserForm
          user={user ? { id: user.id, name: user.name, email: user.email, isActive: user.isActive, roleIds: user.roles.map((r) => r.roleId) } : null}
          roles={assignable.map((r) => ({ id: r.id, name: r.name, description: r.description }))}
        />
        {user && (
          <Panel title="Recent sign-in attempts" description="Login attempt monitoring for this account.">
            {recent.length === 0 ? <p className="text-sm text-muted">No attempts recorded.</p> : (
              <ul className="space-y-2 text-sm">
                {recent.map((a) => (
                  <li key={a.id} className="flex justify-between gap-3">
                    <span className={a.success ? "text-success" : "text-danger"}>{a.success ? "Success" : `Failed (${a.reason ?? "unknown"})`}</span>
                    <span className="text-xs text-subtle">{a.ip ?? "?"} · {a.createdAt.toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}
