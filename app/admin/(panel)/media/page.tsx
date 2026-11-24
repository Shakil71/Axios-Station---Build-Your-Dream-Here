import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader } from "@/components/admin/ui";
import { MediaUploader } from "@/components/admin/module-forms";
import { Pagination } from "@/components/sections/pagination";
import { cn } from "@/lib/utils";

export const metadata = { title: "Media Library" };

export default async function MediaLibraryPage({ searchParams }: PageProps<"/admin/media">) {
  await requirePagePermission("media.manage");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const kind: "IMAGE" | "DOCUMENT" | undefined = sp.kind === "IMAGE" || sp.kind === "DOCUMENT" ? sp.kind : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const perPage = 36;
  const where = {
    ...(q ? { OR: [{ originalName: { contains: q } }, { altText: { contains: q } }, { title: { contains: q } }] } : {}),
    ...(kind ? { kind } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * perPage, take: perPage }),
    prisma.media.count({ where }),
  ]);

  return (
    <>
      <AdminPageHeader title="Media Library" description="Upload and manage images and documents. Files in use by published content cannot be deleted." />
      <MediaUploader />
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <form action="/admin/media" className="flex-1">
          {kind && <input type="hidden" name="kind" value={kind} />}
          <input name="q" defaultValue={q} placeholder="Search by name, alt text or title…" className="h-11 w-full max-w-sm rounded-xl border border-border-strong bg-bg-2 px-3 text-sm" />
        </form>
        {[undefined, "IMAGE", "DOCUMENT"].map((k) => (
          <Link key={k ?? "all"} href={`/admin/media?${new URLSearchParams({ ...(k ? { kind: k } : {}), ...(q ? { q } : {}) })}`} className={cn("rounded-full border px-3 py-1.5 text-xs", kind === k ? "border-brand bg-brand/15" : "border-border text-muted")}>
            {k ? k.toLowerCase() + "s" : "all"}
          </Link>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">No media found.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <Link key={m.id} href={`/admin/media/${m.id}`} className="group overflow-hidden rounded-xl border border-border bg-bg-2/60 transition hover:border-brand">
              <div className="aspect-square bg-bg-3">
                {m.kind === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.altText ?? ""} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><FileText className="h-8 w-8 text-subtle" /></div>
                )}
              </div>
              <div className="px-2.5 py-2">
                <p className="truncate text-xs">{m.originalName}</p>
                {!m.altText && m.kind === "IMAGE" && <p className="text-[10px] text-warning">Missing alt text</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-subtle">{total} files</p>
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / perPage))} basePath="/admin/media" params={{ q: q || undefined, kind }} />
    </>
  );
}
