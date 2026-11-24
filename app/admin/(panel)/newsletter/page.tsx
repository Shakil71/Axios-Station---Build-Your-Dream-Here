import { Download } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader, StatusBadge } from "@/components/admin/ui";
import { SubscriberOps } from "@/components/admin/module-forms";
import { Pagination } from "@/components/sections/pagination";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Newsletter" };

export default async function NewsletterPage({ searchParams }: PageProps<"/admin/newsletter">) {
  await requirePagePermission("newsletter.manage");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 50;
  const where = q ? { email: { contains: q } } : {};
  const [rows, total, active] = await Promise.all([
    prisma.newsletterSubscriber.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage }),
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.count({ where: { status: "SUBSCRIBED" } }),
  ]);
  return (
    <>
      <AdminPageHeader
        title="Newsletter subscribers"
        description={`${active} active subscriber${active === 1 ? "" : "s"}. Duplicate sign-ups are prevented; every email includes an unsubscribe token.`}
        actions={
          <a href="/api/admin/export/subscribers" download className={buttonVariants({ variant: "secondary" })}><Download /> Export CSV</a>
        }
      />
      <form action="/admin/newsletter" className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search email…" className="h-11 w-full max-w-sm rounded-xl border border-border-strong bg-bg-2 px-3 text-sm" />
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-bg-2/50">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle"><th className="px-4 py-3">Email</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Subscribed</th><th className="px-4 py-3" /></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-14 text-center text-muted">No subscribers yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-muted">{r.source ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3"><SubscriberOps id={r.id} status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / perPage))} basePath="/admin/newsletter" params={{ q: q || undefined }} />
    </>
  );
}
