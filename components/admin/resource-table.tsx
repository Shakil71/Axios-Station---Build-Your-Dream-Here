"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { deleteResourceAction, setStatusAction } from "@/actions/admin/resource";
import { ConfirmDialog } from "./confirm-dialog";
import { useToast } from "./toast";
import { StatusBadge } from "./ui";
import { SearchBox } from "@/components/sections/search-box";
import { Badge } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { Column } from "@/lib/admin/resources";

export type TableRow = Record<string, unknown> & { id: string };

export function ResourceTable({
  resourceKey,
  columns,
  rows,
  hasStatus,
  publicPath,
  filters,
  sort,
  dir,
  total,
}: {
  resourceKey: string;
  columns: Column[];
  rows: TableRow[];
  hasStatus: boolean;
  publicPath?: string;
  filters: { name: string; label: string; options: { value: string; label: string }[] }[];
  sort: string;
  dir: string;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<null | { kind: "delete" | "PUBLISHED" | "DRAFT" | "ARCHIVED"; ids: string[] }>(null);
  const [pending, start] = useTransition();

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next}`);
  }

  function sortHref(col: string) {
    const next = new URLSearchParams(params.toString());
    next.set("sort", col);
    next.set("dir", sort === col && dir === "asc" ? "desc" : "asc");
    return `${pathname}?${next}`;
  }

  function run() {
    if (!confirm) return;
    const { kind, ids } = confirm;
    start(async () => {
      const res = kind === "delete" ? await deleteResourceAction(resourceKey, ids) : await setStatusAction(resourceKey, ids, kind);
      toast(res.ok, res.message ?? (res.ok ? "Done." : "Failed."));
      if (res.ok) {
        setSelected(new Set());
        router.refresh();
      }
    });
    setConfirm(null);
  }

  function cell(row: TableRow, c: Column) {
    const v = row[c.name];
    switch (c.type) {
      case "status":
        return v ? <StatusBadge status={String(v)} /> : null;
      case "boolean":
        return v ? <Check className="h-4 w-4 text-success" aria-label="Yes" /> : <span className="text-subtle">—</span>;
      case "date":
        return <span className="whitespace-nowrap text-muted">{v ? formatDate(String(v)) : "—"}</span>;
      case "relation":
        return <span className="text-muted">{v && typeof v === "object" ? String((v as Record<string, unknown>)[c.relationField ?? "name"] ?? "—") : "—"}</span>;
      case "badge":
        return v ? <Badge tone="muted">{String(v)}</Badge> : null;
      case "number":
        return <span className="tabular-nums text-muted">{v === null || v === undefined ? "—" : String(v)}</span>;
      default:
        return <span className="line-clamp-2">{v === null || v === undefined || v === "" ? "—" : String(v)}</span>;
    }
  }

  const ids = [...selected];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Suspense>
            <SearchBox placeholder="Search…" className="w-full sm:w-72" />
          </Suspense>
          {filters.map((f) => (
            <select
              key={f.name}
              aria-label={`Filter by ${f.label}`}
              value={params.get(f.name) ?? ""}
              onChange={(e) => setParam(f.name, e.target.value)}
              className="h-11 rounded-xl border border-border-strong bg-bg-2 px-3 text-sm text-fg"
            >
              <option value="">All {f.label.toLowerCase()}</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
        </div>
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-3 py-2">
            <span className="text-sm font-medium">{selected.size} selected</span>
            {hasStatus && (
              <>
                <button onClick={() => setConfirm({ kind: "PUBLISHED", ids })} className={buttonVariants({ size: "sm", variant: "secondary" })} disabled={pending}>Publish</button>
                <button onClick={() => setConfirm({ kind: "DRAFT", ids })} className={buttonVariants({ size: "sm", variant: "secondary" })} disabled={pending}>Unpublish</button>
              </>
            )}
            <button onClick={() => setConfirm({ kind: "delete", ids })} className={buttonVariants({ size: "sm", variant: "danger" })} disabled={pending}>
              <Trash2 /> Delete
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-bg-2/50">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" className="h-4 w-4 accent-[var(--brand)]" />
              </th>
              {columns.map((c) => (
                <th key={c.name} className="px-4 py-3 font-semibold">
                  {c.sortable ? (
                    <Link href={sortHref(c.name)} className="inline-flex items-center gap-1 hover:text-fg">
                      {c.label}
                      {sort === c.name ? (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </Link>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-14 text-center text-muted">
                  No items found.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className={cn("border-b border-border last:border-0 hover:bg-surface", selected.has(row.id) && "bg-brand/5")}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label="Select row" className="h-4 w-4 accent-[var(--brand)]" />
                </td>
                {columns.map((c, i) => (
                  <td key={c.name} className="px-4 py-3 align-middle">
                    {i === 0 ? (
                      <Link href={`/admin/content/${resourceKey}/${row.id}`} className="font-medium text-fg hover:text-brand-2">
                        {cell(row, c)}
                      </Link>
                    ) : (
                      cell(row, c)
                    )}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {publicPath && typeof row.slug === "string" && row.status === "PUBLISHED" && (
                      <a href={publicPath.replace("{slug}", row.slug)} target="_blank" rel="noopener" className="rounded-lg p-2 text-subtle hover:bg-surface-2 hover:text-fg" aria-label="View on site">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Link href={`/admin/content/${resourceKey}/${row.id}`} className="rounded-lg p-2 text-subtle hover:bg-surface-2 hover:text-fg" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => setConfirm({ kind: "delete", ids: [row.id] })} className="rounded-lg p-2 text-subtle hover:bg-danger/10 hover:text-danger cursor-pointer" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-subtle">{total} total</p>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={
          confirm?.kind === "delete"
            ? `Delete ${confirm.ids.length} item${confirm.ids.length > 1 ? "s" : ""}?`
            : confirm?.kind === "PUBLISHED"
              ? "Publish selected items?"
              : "Move selected items to draft?"
        }
        description={confirm?.kind === "delete" ? "This removes the item from the website. This action cannot be undone from the dashboard." : "The public website will update immediately."}
        confirmLabel={confirm?.kind === "delete" ? "Delete" : "Confirm"}
        destructive={confirm?.kind === "delete"}
        onConfirm={run}
      />
    </div>
  );
}
