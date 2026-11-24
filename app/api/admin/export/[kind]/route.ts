import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { can, getCurrentUser } from "@/lib/auth/guard";
import { logActivity } from "@/lib/db/activity";
import { toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const user = await getCurrentUser();
  const stamp = new Date().toISOString().slice(0, 10);

  if (kind === "leads") {
    if (!can(user, "leads.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rows = await prisma.contactInquiry.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { assignedTo: { select: { name: true } } },
    });
    const csv = toCsv(
      ["Created", "Name", "Email", "Phone", "Company", "Service", "Budget", "Preferred contact", "Status", "Assigned to", "Message"],
      rows.map((r) => [r.createdAt, r.name, r.email, r.phone, r.company, r.serviceInterest, r.budgetRange, r.preferredContact, r.status, r.assignedTo?.name, r.message]),
    );
    await logActivity({ userId: user!.id, action: "export", entityType: "lead", summary: `Exported ${rows.length} leads` });
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads-${stamp}.csv"`, "Cache-Control": "no-store" } });
  }

  if (kind === "subscribers") {
    if (!can(user, "newsletter.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const rows = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
    const csv = toCsv(["Email", "Status", "Source", "Subscribed", "Unsubscribed"], rows.map((r) => [r.email, r.status, r.source, r.consentAt, r.unsubscribedAt]));
    await logActivity({ userId: user!.id, action: "export", entityType: "newsletter", summary: `Exported ${rows.length} subscribers` });
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="subscribers-${stamp}.csv"`, "Cache-Control": "no-store" } });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
