import { prisma } from "@/lib/db/prisma";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader } from "@/components/admin/ui";
import { RolesMatrix } from "@/components/admin/module-forms";

export const metadata = { title: "Roles & Permissions" };

export default async function RolesPage() {
  await requirePagePermission("roles.manage");
  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({ orderBy: { createdAt: "asc" }, include: { permissions: { include: { permission: true } } } }),
    prisma.permission.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] }),
  ]);
  const granted = Object.fromEntries(roles.map((r) => [r.id, r.permissions.map((p) => p.permission.key)]));
  return (
    <>
      <AdminPageHeader title="Roles & Permissions" description="Permissions are enforced on the server for every page, action and API — not just by hiding buttons. Super Admin always has full access." />
      <RolesMatrix roles={roles.map((r) => ({ id: r.id, key: r.key, name: r.name }))} permissions={permissions} granted={granted} />
    </>
  );
}
