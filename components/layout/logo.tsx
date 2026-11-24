"use client";

import Image from "next/image";
import { LocaleLink as Link, useT } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function Logo({ name = "Axios Station", className, compact = false }: { name?: string; className?: string; compact?: boolean }) {
  const [first, ...rest] = name.split(" ");
  const t = useT();
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <Image
        src="/images/brand/axios-mark.png"
        alt=""
        width={512}
        height={258}
        priority
        className="h-7 w-auto transition-transform duration-300 group-hover:scale-105"
      />
      {compact && <span className="sr-only">{name}</span>}
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-bold tracking-[0.18em] text-fg uppercase keep-tracking" lang="en">{first}</span>
          {rest.length > 0 && " "}
          {rest.length > 0 && (
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.42em] text-brand-2 keep-tracking" lang="en">{rest.join(" ")}</span>
          )}
        </span>
      )}
      <span className="sr-only"> {t("nav.homeSr")}</span>
    </Link>
  );
}
