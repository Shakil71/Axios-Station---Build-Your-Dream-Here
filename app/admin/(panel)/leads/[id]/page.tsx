import { notFound } from "next/navigation";
import { Mail, Phone, Building2, Wallet, MessageSquare } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { can, requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { DeleteLeadButton, LeadNoteForm, LeadReplyForm, LeadStatusForm } from "@/components/admin/lead-forms";
import { isEmailConfigured } from "@/lib/email";

export default async function LeadDetailPage({ params }: PageProps<"/admin/leads/[id]">) {
  const user = await requirePagePermission("leads.view");
  const { id } = await params;
  const lead = await prisma.contactInquiry.findFirst({
    where: { id, deletedAt: null },
    include: { assignedTo: { select: { name: true } }, notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } } },
  });
  if (!lead) notFound();
  const manage = can(user, "leads.manage");
  const users = manage
    ? await prisma.user.findMany({
        where: { isActive: true, deletedAt: null, roles: { some: { role: { permissions: { some: { permission: { key: "leads.manage" } } } } } } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const facts = [
    { Icon: Mail, label: "Email", value: lead.email, href: `mailto:${lead.email}` },
    lead.phone && { Icon: Phone, label: "Phone", value: lead.phone, href: `tel:${lead.phone}` },
    lead.company && { Icon: Building2, label: "Company", value: lead.company },
    lead.budgetRange && { Icon: Wallet, label: "Budget", value: lead.budgetRange },
    { Icon: MessageSquare, label: "Prefers", value: lead.preferredContact.toLowerCase() },
  ].filter(Boolean) as { Icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <AdminPageHeader
        title={lead.name}
        description={`${lead.serviceInterest ?? "General inquiry"} · received ${lead.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`}
        back={{ href: "/admin/leads", label: "Leads" }}
        actions={<><StatusBadge status={lead.status} />{manage && <DeleteLeadButton id={lead.id} />}</>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel title="Project description">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg/90">{lead.message}</p>
            <p className="mt-4 text-xs text-subtle">Privacy consent given {lead.consentAt.toLocaleString("en-US")}</p>
          </Panel>
          {manage && (
            <Panel title="Reply by email" description={isEmailConfigured() ? `Sends from the configured mailbox to ${lead.email}; replies come back to you.` : "SMTP is not configured — replies cannot be sent until SMTP settings are added to the server environment."}>
              <LeadReplyForm id={lead.id} defaultSubject={`Re: Your inquiry to Axios Station`} />
            </Panel>
          )}
          <Panel title="History & notes">
            {manage && <LeadNoteForm id={lead.id} />}
            <ol className="mt-6 space-y-4 border-l border-border pl-5">
              {lead.notes.map((n) => (
                <li key={n.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-brand" />
                  <p className="text-xs text-subtle">{n.author?.name ?? "System"} · {n.kind.replace("_", " ")} · {n.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
                </li>
              ))}
              <li className="relative">
                <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-border-strong" />
                <p className="text-xs text-subtle">Website · {lead.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
                <p className="mt-1 text-sm">Inquiry submitted via contact form</p>
              </li>
            </ol>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Contact">
            <ul className="space-y-3">
              {facts.map((f) => (
                <li key={f.label} className="flex items-start gap-3 text-sm">
                  <f.Icon className="mt-0.5 h-4 w-4 text-brand-2" />
                  <span><span className="block text-xs text-subtle">{f.label}</span>{f.href ? <a href={f.href} className="hover:text-brand-2">{f.value}</a> : f.value}</span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Pipeline">
            <LeadStatusForm id={lead.id} status={lead.status} assignedToId={lead.assignedToId} users={users} disabled={!manage} />
          </Panel>
        </div>
      </div>
    </>
  );
}
