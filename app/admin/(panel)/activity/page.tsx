import { prisma } from "@/lib/db/prisma";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader } from "@/components/admin/ui";
import { Badge } from "@/components/ui/primitives";
import { Pagination } from "@/components/sections/pagination";

export const metadata = { title: "Activity Logs" };

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  await requirePagePermission("logs.view");
  const sp = await searchParams;
  const entity = typeof sp.entity === "string" ? sp.entity.slice(0, 64) : undefined;
  const action = typeof sp.action === "string" ? sp.action.slice(0, 64) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 50;
  const where = { ...(entity ? { entityType: entity } : {}), ...(action ? { action } : {}) };
  const [rows, total, entities] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage, include: { user: { select: { name: true, email: true } } } }),
    prisma.activityLog.count({ where }),
    prisma.activityLog.groupBy({ by: ["entityType"], _count: { entityType: true }, orderBy: { entityType: "asc" } }),
  ]);
  return (
    <>
      <AdminPageHeader title="Activity Logs" description="Audit trail of sign-ins, content changes, exports and administrative actions." />
      <form action="/admin/activity" className="mb-4 flex flex-wrap gap-2">
        <select name="entity" defaultValue={entity ?? ""} className="h-11 rounded-xl border border-border-strong bg-bg-2 px-3 text-sm" aria-label="Entity">
          <option value="">All areas</option>
          {entities.map((e) => <option key={e.entityType} value={e.entityType}>{e.entityType} ({e._count.entityType})</option>)}
        </select>
        <input name="action" defaultValue={action ?? ""} placeholder="Action (e.g. delete, login)" className="h-11 rounded-xl border border-border-strong bg-bg-2 px-3 text-sm" />
        <button className="h-11 rounded-xl border border-border-strong px-4 text-sm cursor-pointer">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-bg-2/50">
        <table className="w-full min-w-[760px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle"><th className="px-4 py-3">When</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Area</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">IP</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-14 text-center text-muted">No activity recorded.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-muted">{r.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-4 py-3">{r.user?.name ?? <span className="text-subtle">System / visitor</span>}</td>
                <td className="px-4 py-3"><Badge tone={r.action === "delete" ? "danger" : r.action === "login" ? "brand" : "muted"}>{r.action}</Badge></td>
                <td className="px-4 py-3 text-muted">{r.entityType}</td>
                <td className="px-4 py-3">{r.summary ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-subtle">{r.ip ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / perPage))} basePath="/admin/activity" params={{ entity, action }} />
    </>
  );
}
