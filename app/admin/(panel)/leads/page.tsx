import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { can, requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader, StatusBadge } from "@/components/admin/ui";
import { Pagination } from "@/components/sections/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { Prisma } from "@/lib/generated/prisma/client";

export const metadata = { title: "Leads" };
const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"] as const;

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const user = await requirePagePermission("leads.view");
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (STATUSES as readonly string[]).includes(sp.status) ? (sp.status as (typeof STATUSES)[number]) : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const mine = sp.mine === "1";
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 25;

  const where: Prisma.ContactInquiryWhereInput = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(mine ? { assignedToId: user.id } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { company: { contains: q } }] } : {}),
  };
  const [rows, total, counts] = await Promise.all([
    prisma.contactInquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage, include: { assignedTo: { select: { name: true } } } }),
    prisma.contactInquiry.count({ where }),
    prisma.contactInquiry.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { status: true } }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count.status ?? 0;

  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, q: q || undefined, mine: mine ? "1" : undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/leads${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Leads & inquiries"
        description="Every contact-form submission is stored here, even if email notifications fail."
        actions={
          can(user, "leads.manage") ? (
            <a href="/api/admin/export/leads" download className={buttonVariants({ variant: "secondary" })}><Download /> Export CSV</a>
          ) : undefined
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={link({ status: undefined })} className={cn("rounded-full border px-3 py-1.5 text-xs", !status ? "border-brand bg-brand/15" : "border-border text-muted")}>All</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={link({ status: s })} className={cn("rounded-full border px-3 py-1.5 text-xs", status === s ? "border-brand bg-brand/15" : "border-border text-muted")}>
            {s.replace("_", " ").toLowerCase()} <span className="ml-1 text-subtle">{countOf(s)}</span>
          </Link>
        ))}
        <Link href={link({ mine: mine ? undefined : "1" })} className={cn("rounded-full border px-3 py-1.5 text-xs", mine ? "border-brand bg-brand/15" : "border-border text-muted")}>Assigned to me</Link>
      </div>
      <form className="mb-4" action="/admin/leads">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Search name, email, company…" className="h-11 w-full max-w-sm rounded-xl border border-border-strong bg-bg-2 px-3 text-sm" />
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-bg-2/50">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle">
              <th className="px-4 py-3">Contact</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Budget</th><th className="px-4 py-3">Assigned</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-14 text-center text-muted">No leads found.</td></tr>}
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0 hover:bg-surface">
                <td className="px-4 py-3">
                  <Link href={`/admin/leads/${l.id}`} className="font-medium hover:text-brand-2">{l.name}</Link>
                  <p className="text-xs text-subtle">{l.email}{l.company ? ` · ${l.company}` : ""}</p>
                </td>
                <td className="px-4 py-3 text-muted">{l.serviceInterest ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{l.budgetRange ?? "—"}</td>
                <td className="px-4 py-3 text-muted">{l.assignedTo?.name ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-subtle">{total} total</p>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / perPage))} basePath="/admin/leads" params={{ status, q: q || undefined, mine: mine ? "1" : undefined }} />
    </>
  );
}
