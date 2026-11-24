import Link from "next/link";
import { ArrowRight, Briefcase, FileText, Inbox, Layers, Mail, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { can, requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

async function stats() {
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const [leads, newLeads, services, projects, posts, subscribers, views30, recentLeads, recentActivity, topPaths, internalTracking] = await Promise.all([
    prisma.contactInquiry.count({ where: { deletedAt: null } }),
    prisma.contactInquiry.count({ where: { deletedAt: null, status: "NEW" } }),
    prisma.service.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    prisma.project.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    prisma.blogPost.count({ where: { deletedAt: null } }),
    prisma.newsletterSubscriber.count({ where: { status: "SUBSCRIBED" } }),
    prisma.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: since30 } } }),
    prisma.contactInquiry.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } }),
    prisma.analyticsEvent.groupBy({ by: ["path"], where: { type: "page_view", createdAt: { gte: since30 } }, _count: { path: true }, orderBy: { _count: { path: "desc" } }, take: 6 }),
    prisma.siteSetting.findUnique({ where: { key: "analytics.internalPageViews" } }),
  ]);
  return { leads, newLeads, services, projects, posts, subscribers, views30, recentLeads, recentActivity, topPaths, trackingOn: internalTracking?.value === true };
}

export default async function DashboardPage() {
  const user = await requirePagePermission("dashboard.view");
  const s = await stats();
  const canLeads = can(user, "leads.view");

  const cards = [
    canLeads && { label: "Total leads", value: s.leads, Icon: Inbox, href: "/admin/leads" },
    canLeads && { label: "New inquiries", value: s.newLeads, Icon: Sparkles, href: "/admin/leads?status=NEW" },
    { label: "Published services", value: s.services, Icon: Layers, href: "/admin/content/services" },
    { label: "Published projects", value: s.projects, Icon: Briefcase, href: "/admin/content/projects" },
    { label: "Blog posts", value: s.posts, Icon: FileText, href: "/admin/content/blog-posts" },
    can(user, "newsletter.manage") && { label: "Subscribers", value: s.subscribers, Icon: Mail, href: "/admin/newsletter" },
  ].filter(Boolean) as { label: string; value: number; Icon: typeof Inbox; href: string }[];

  return (
    <>
      <AdminPageHeader title={`Welcome back, ${user.name.split(" ")[0]}`} description="Live figures from your database. Nothing on this page is estimated." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border border-border bg-bg-2/60 p-5 transition hover:border-brand/40">
            <c.Icon className="h-5 w-5 text-brand-2" />
            <p className="mt-4 font-display text-3xl font-bold tabular-nums">{c.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {canLeads && (
          <Panel title="Recent inquiries" actions={<Link href="/admin/leads" className="inline-flex items-center gap-1 text-sm text-brand-2">All leads <ArrowRight className="h-4 w-4" /></Link>}>
            {s.recentLeads.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No inquiries yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {s.recentLeads.map((l) => (
                  <li key={l.id}>
                    <Link href={`/admin/leads/${l.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-brand-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{l.name}{l.company ? ` · ${l.company}` : ""}</span>
                        <span className="block truncate text-xs text-subtle">{l.serviceInterest ?? "General inquiry"} · {formatDate(l.createdAt)}</span>
                      </span>
                      <StatusBadge status={l.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        <Panel title="Content performance" description="First-party page views, last 30 days.">
          {!s.trackingOn ? (
            <p className="py-6 text-center text-sm text-muted">Page-view tracking is off. Enable it in Analytics Settings to see data here.</p>
          ) : s.topPaths.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No page views recorded yet.</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted"><span className="font-display text-2xl font-bold text-fg">{s.views30.toLocaleString()}</span> page views</p>
              <ul className="space-y-2.5">
                {s.topPaths.map((p) => {
                  const pct = Math.round((p._count.path / Math.max(1, s.topPaths[0]!._count.path)) * 100);
                  return (
                    <li key={p.path}>
                      <div className="flex justify-between text-xs"><span className="truncate text-fg">{p.path}</span><span className="tabular-nums text-muted">{p._count.path}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2" style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Panel>

        {can(user, "logs.view") && (
          <Panel title="Recent activity" actions={<Link href="/admin/activity" className="inline-flex items-center gap-1 text-sm text-brand-2">All activity <ArrowRight className="h-4 w-4" /></Link>}>
            {s.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {s.recentActivity.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-4 text-sm">
                    <span className="min-w-0"><span className="font-medium">{a.user?.name ?? "System"}</span> <span className="text-muted">{a.summary ?? `${a.action} ${a.entityType}`}</span></span>
                    <span className="shrink-0 text-xs text-subtle">{formatDate(a.createdAt)}</span>
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
