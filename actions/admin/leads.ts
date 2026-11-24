"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/db/activity";
import { escapeHtml, sendMail } from "@/lib/email";
import { guarded, type Result } from "./guarded";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"] as const;
const id = z.string().min(1).max(191);

export async function updateLeadAction(leadId: string, _prev: Result, form: FormData): Promise<Result> {
  return guarded(async () => {
    const user = await requirePermission("leads.manage");
    const parsed = z
      .object({ status: z.enum(STATUSES), assignedToId: z.string().max(191).transform((v) => v || null) })
      .safeParse({ status: form.get("status"), assignedToId: form.get("assignedToId") ?? "" });
    if (!parsed.success) return { ok: false, message: "Invalid status or assignee." };
    const lead = await prisma.contactInquiry.findFirst({ where: { id: id.parse(leadId), deletedAt: null } });
    if (!lead) return { ok: false, message: "Lead not found." };
    if (parsed.data.assignedToId) {
      const assignee = await prisma.user.findFirst({ where: { id: parsed.data.assignedToId, isActive: true, deletedAt: null } });
      if (!assignee) return { ok: false, message: "Assignee not found." };
    }
    const notes: { kind: string; body: string }[] = [];
    if (lead.status !== parsed.data.status) notes.push({ kind: "status_change", body: `Status changed from ${lead.status} to ${parsed.data.status}` });
    if (lead.assignedToId !== parsed.data.assignedToId) {
      const name = parsed.data.assignedToId ? (await prisma.user.findUnique({ where: { id: parsed.data.assignedToId }, select: { name: true } }))?.name : null;
      notes.push({ kind: "assignment", body: name ? `Assigned to ${name}` : "Unassigned" });
    }
    if (!notes.length) return { ok: true, message: "No changes." };
    await prisma.$transaction([
      prisma.contactInquiry.update({ where: { id: lead.id }, data: parsed.data }),
      prisma.leadNote.createMany({ data: notes.map((n) => ({ ...n, inquiryId: lead.id, authorId: user.id })) }),
    ]);
    await logActivity({ userId: user.id, action: "update", entityType: "lead", entityId: lead.id, summary: notes.map((n) => n.body).join("; ") });
    revalidatePath(`/admin/leads/${lead.id}`);
    return { ok: true, message: "Lead updated." };
  });
}

export async function addLeadNoteAction(leadId: string, _prev: Result, form: FormData): Promise<Result> {
  return guarded(async () => {
    const user = await requirePermission("leads.manage");
    const body = z.string().trim().min(1, "Note is empty.").max(5000).safeParse(form.get("body"));
    if (!body.success) return { ok: false, message: body.error.issues[0]?.message };
    await prisma.leadNote.create({ data: { inquiryId: id.parse(leadId), authorId: user.id, kind: "note", body: body.data } });
    revalidatePath(`/admin/leads/${leadId}`);
    return { ok: true, message: "Note added." };
  });
}

export async function replyLeadAction(leadId: string, _prev: Result, form: FormData): Promise<Result> {
  return guarded(async () => {
    const user = await requirePermission("leads.manage");
    const parsed = z
      .object({ subject: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(10_000) })
      .safeParse({ subject: form.get("subject"), body: form.get("body") });
    if (!parsed.success) return { ok: false, message: "Subject and message are required." };
    const lead = await prisma.contactInquiry.findFirst({ where: { id: id.parse(leadId), deletedAt: null } });
    if (!lead) return { ok: false, message: "Lead not found." };
    const res = await sendMail({
      to: lead.email,
      replyTo: user.email,
      subject: parsed.data.subject,
      text: parsed.data.body,
      html: `<div style="white-space:pre-wrap;font-family:sans-serif">${escapeHtml(parsed.data.body)}</div>`,
    });
    if (!res.sent) return { ok: false, message: `Email not sent: ${res.error}. Configure SMTP in the server environment.` };
    await prisma.$transaction([
      prisma.leadNote.create({ data: { inquiryId: lead.id, authorId: user.id, kind: "reply", body: `Subject: ${parsed.data.subject}\n\n${parsed.data.body}` } }),
      ...(lead.status === "NEW" ? [prisma.contactInquiry.update({ where: { id: lead.id }, data: { status: "CONTACTED" } })] : []),
    ]);
    await logActivity({ userId: user.id, action: "reply", entityType: "lead", entityId: lead.id, summary: `Replied to ${lead.email}` });
    revalidatePath(`/admin/leads/${lead.id}`);
    return { ok: true, message: "Reply sent." };
  });
}

export async function deleteLeadAction(leadId: string): Promise<Result> {
  return guarded(async () => {
    const user = await requirePermission("leads.manage");
    await prisma.contactInquiry.update({ where: { id: id.parse(leadId) }, data: { deletedAt: new Date() } });
    await logActivity({ userId: user.id, action: "delete", entityType: "lead", entityId: leadId, summary: "Deleted lead" });
    revalidatePath("/admin/leads");
    return { ok: true, message: "Lead deleted." };
  });
}
