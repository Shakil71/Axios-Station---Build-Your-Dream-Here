"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

/** URL-synced search input with 350ms debounce. */
export function SearchBox({ placeholder = "Search…", clearLabel = "Clear search", className }: { placeholder?: string; clearLabel?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [pending, start] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      next.delete("page");
      start(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Search className={cn("pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle", pending && "animate-pulse text-brand-2")} />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-xl border border-border-strong bg-bg-2/70 pl-10 pr-10 text-sm text-fg placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring"
      />
      {value && (
        <button type="button" onClick={() => setValue("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-fg cursor-pointer" aria-label={clearLabel}>
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
