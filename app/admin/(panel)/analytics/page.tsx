import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "Analytics" };

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

export default async function AnalyticsPage() {
  await requirePagePermission("analytics.manage");
  const since = daysAgo(30);
  const [setting, ga, total, byPath, byRef, daily] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "analytics.internalPageViews" } }),
    prisma.siteSetting.findUnique({ where: { key: "analytics.gaMeasurementId" } }),
    prisma.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: since } } }),
    prisma.analyticsEvent.groupBy({ by: ["path"], where: { type: "page_view", createdAt: { gte: since } }, _count: { path: true }, orderBy: { _count: { path: "desc" } }, take: 15 }),
    prisma.analyticsEvent.groupBy({ by: ["referrer"], where: { type: "page_view", createdAt: { gte: since }, referrer: { not: null } }, _count: { referrer: true }, orderBy: { _count: { referrer: "desc" } }, take: 10 }),
    prisma.$queryRaw<{ d: Date; c: bigint }[]>`SELECT DATE(createdAt) AS d, COUNT(*) AS c FROM AnalyticsEvent WHERE type = 'page_view' AND createdAt >= ${since} GROUP BY DATE(createdAt) ORDER BY d`,
  ]);
  const on = setting?.value === true;
  const max = Math.max(1, ...daily.map((x) => Number(x.c)));
  const gaId = typeof ga?.value === "string" ? ga.value : "";

  return (
    <>
      <AdminPageHeader title="Analytics" description="Privacy-friendly first-party page views (no cookies, no personal data). For full analytics, connect Google Analytics in Analytics Settings." />
      {!on && (
        <p className="mb-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          First-party page-view tracking is disabled. <Link href="/admin/settings/analytics" className="underline">Enable it</Link> to start collecting data.
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Last 30 days">
          <p className="font-display text-4xl font-bold">{total.toLocaleString()}</p>
          <p className="text-sm text-muted">page views</p>
          <p className="mt-4 text-xs text-subtle">Google Analytics: {gaId ? `configured (${gaId}) — loads only after visitor consent` : "not configured"}</p>
        </Panel>
        <div className="xl:col-span-2">
          <Panel title="Daily page views">
            {daily.length === 0 ? <p className="py-6 text-center text-sm text-muted">No data yet.</p> : (
              <div className="flex h-40 items-end gap-1" role="img" aria-label="Daily page views bar chart">
                {daily.map((x) => (
                  <div key={String(x.d)} className="group relative flex-1">
                    <div className="rounded-t bg-gradient-to-t from-brand to-brand-2" style={{ height: `${(Number(x.c) / max) * 150}px` }} />
                    <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-bg-3 px-1.5 py-0.5 text-[10px] group-hover:block">{new Date(x.d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: {Number(x.c)}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
        <div className="xl:col-span-2">
          <Panel title="Top pages">
            {byPath.length === 0 ? <p className="text-sm text-muted">No data yet.</p> : (
              <table className="w-full text-sm"><tbody>
                {byPath.map((p) => <tr key={p.path} className="border-b border-border last:border-0"><td className="py-2">{p.path}</td><td className="py-2 text-right tabular-nums text-muted">{p._count.path}</td></tr>)}
              </tbody></table>
            )}
          </Panel>
        </div>
        <Panel title="Top referrers">
          {byRef.length === 0 ? <p className="text-sm text-muted">No referrer data yet.</p> : (
            <ul className="space-y-2 text-sm">{byRef.map((r) => <li key={r.referrer} className="flex justify-between gap-3"><span className="truncate">{r.referrer}</span><span className="tabular-nums text-muted">{r._count.referrer}</span></li>)}</ul>
          )}
        </Panel>
      </div>
    </>
  );
}
