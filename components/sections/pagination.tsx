import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocaleLink as Link } from "@/components/i18n/locale-provider";
import { getT } from "@/lib/i18n/server";

export function Pagination({ page, pages, basePath, params }: { page: number; pages: number; basePath: string; params: Record<string, string | undefined> }) {
  if (pages <= 1) return null;
  const t = getT();
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  };
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label={t("common.pagination")}>
      <Link
        href={href(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted hover:text-fg", page === 1 && "pointer-events-none opacity-40")}
        aria-label={t("common.prevPage")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1]! > 1 && <span className="px-1 text-subtle">…</span>}
          <Link
            href={href(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn("inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm", n === page ? "border-brand bg-brand/15 text-fg" : "border-border text-muted hover:text-fg")}
          >
            {n}
          </Link>
        </span>
      ))}
      <Link
        href={href(Math.min(pages, page + 1))}
        aria-disabled={page === pages}
        className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted hover:text-fg", page === pages && "pointer-events-none opacity-40")}
        aria-label={t("common.nextPage")}
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
