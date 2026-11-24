import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requirePagePermission } from "@/lib/auth/guard";
import { AdminPageHeader } from "@/components/admin/ui";
import { AddSectionForm, SectionEditor, type SectionView } from "@/components/admin/module-forms";
import { SECTION_TYPES } from "@/components/sections/home-sections";
import { asStringArray, asTitledItems, cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { TranslationPanel } from "@/components/admin/translation-panel";
import { fieldName, loadTranslations, type TranslationRow } from "@/services/admin/translations";
import { TRANSLATABLE } from "@/lib/i18n/translatable";
import { localizeHref } from "@/lib/i18n";

export const metadata = { title: "Homepage Builder" };

const PAGES = [
  { key: "home", label: "Homepage", href: "/", types: [...SECTION_TYPES] },
  { key: "about", label: "About page", href: "/about", types: ["intro", "mission", "vision", "values", "philosophy", "milestones"] },
];

export default async function HomepageBuilder({ searchParams }: PageProps<"/admin/homepage">) {
  await requirePagePermission(["homepage.manage", "pages.manage"]);
  const sp = await searchParams;
  const current = PAGES.find((p) => p.key === sp.page) ?? PAGES[0]!;
  const page = await prisma.page.findUnique({
    where: { key: current.key },
    include: { sections: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { image: true } } },
  });

  const sections: SectionView[] = (page?.sections ?? []).map((s) => {
    const d = (s.data ?? {}) as Record<string, unknown>;
    const stats = Array.isArray(d.stats) ? (d.stats as { value?: string; label?: string }[]).map((x) => `${x.value ?? ""} | ${x.label ?? ""}`).join("\n") : "";
    return {
      id: s.id,
      type: s.type,
      title: s.title ?? "",
      subtitle: s.subtitle ?? "",
      description: s.description ?? "",
      ctaLabel: s.ctaLabel ?? "",
      ctaHref: s.ctaHref ?? "",
      cta2Label: s.cta2Label ?? "",
      cta2Href: s.cta2Href ?? "",
      image: s.image ? { id: s.image.id, url: s.image.url, kind: s.image.kind, originalName: s.image.originalName, altText: s.image.altText } : null,
      items: asTitledItems(d.items).map((i) => (i.description ? `${i.title} | ${i.description}` : i.title)).join("\n"),
      list: asStringArray(d.list).join("\n"),
      stats,
      limit: String(typeof d.limit === "number" ? d.limit : 6),
      isEnabled: s.isEnabled,
    };
  });

  // Bengali versions of each section (shown inside the section editor).
  const existing = await loadTranslations("pageSection", sections.map((s) => s.id));
  const trRows = (s: SectionView): TranslationRow[] =>
    TRANSLATABLE.pageSection!.map((f) => ({
      entityId: s.id,
      field: f.name,
      label: f.label,
      kind: f.kind,
      english: String(s[f.name as keyof SectionView] ?? ""),
      value: existing[fieldName(s.id, f.name)] ?? "",
    }));

  return (
    <>
      <AdminPageHeader
        title="Homepage Builder"
        description="Enable, disable, reorder and edit page sections. Lists such as services, projects and posts pull live from their modules; mark items as Featured to control what appears."
        actions={<a href={current.href} target="_blank" rel="noopener" className={buttonVariants({ variant: "secondary" })}>View page <ExternalLink /></a>}
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {PAGES.map((p) => (
            <Link key={p.key} href={`/admin/homepage?page=${p.key}`} className={cn("rounded-full border px-4 py-2 text-sm", p.key === current.key ? "border-brand bg-brand/15" : "border-border text-muted")}>
              {p.label}
            </Link>
          ))}
        </div>
        {page && <AddSectionForm pageKey={current.key} types={current.types} />}
      </div>
      {!page ? (
        <p className="rounded-2xl border border-border p-10 text-center text-muted">This page has not been created yet. Run the database seed script to create default pages.</p>
      ) : (
        <div className="space-y-3">
          {sections.map((s, i) => (
            <SectionEditor
              key={s.id}
              s={s}
              index={i}
              count={sections.length}
              translation={<TranslationPanel target={{ scope: "section", id: s.id }} rows={trRows(s)} publicPath={localizeHref(current.href, "bn")} />}
            />
          ))}
        </div>
      )}
    </>
  );
}
