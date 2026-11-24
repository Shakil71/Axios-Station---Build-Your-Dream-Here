import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader } from "@/components/admin/ui";
import { MediaDetail } from "@/components/admin/module-forms";
import { mediaReferences } from "@/services/admin/media";

export default async function MediaDetailPage({ params }: PageProps<"/admin/media/[id]">) {
  await requirePagePermission("media.manage");
  const { id } = await params;
  const m = await prisma.media.findUnique({ where: { id } });
  if (!m) notFound();
  const refs = await mediaReferences(id);
  return (
    <>
      <AdminPageHeader title={m.title || m.originalName} back={{ href: "/admin/media", label: "Media Library" }} />
      <MediaDetail
        m={{
          id: m.id, url: m.url, kind: m.kind, originalName: m.originalName, altText: m.altText, width: m.width, height: m.height,
          title: m.title, caption: m.caption, sizeBytes: m.sizeBytes, mimeType: m.mimeType, createdAt: m.createdAt.toISOString(), refs,
        }}
      />
    </>
  );
}
