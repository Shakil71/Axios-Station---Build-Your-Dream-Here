import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader } from "@/components/admin/ui";
import { Badge } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  await requirePagePermission("users.manage");
  const users = await prisma.user.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" }, include: { roles: { include: { role: true } } } });
  return (
    <>
      <AdminPageHeader title="Users" description="Admin accounts and their roles." actions={<Link href="/admin/users/new" className={buttonVariants()}><Plus /> New user</Link>} />
      <div className="overflow-x-auto rounded-2xl border border-border bg-bg-2/50">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle"><th className="px-4 py-3">User</th><th className="px-4 py-3">Roles</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last sign-in</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3"><Link href={`/admin/users/${u.id}`} className="font-medium hover:text-brand-2">{u.name}</Link><p className="text-xs text-subtle">{u.email}</p></td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{u.roles.map((r) => <Badge key={r.roleId} tone={r.role.key === "super_admin" ? "brand" : "muted"}>{r.role.name}</Badge>)}</div></td>
                <td className="px-4 py-3">
                  {!u.isActive ? <Badge tone="danger">Inactive</Badge> : u.lockedUntil && u.lockedUntil > new Date() ? <Badge tone="warning">Locked</Badge> : <Badge tone="success">Active</Badge>}
                </td>
                <td className="px-4 py-3 text-muted">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
