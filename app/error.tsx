"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { localeFromPath, translator } from "@/lib/i18n";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = translator(localeFromPath(usePathname() ?? "/"));
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("error.title")}</h1>
        <p className="mt-2 text-muted">{t("error.text")}</p>
        {error.digest && <p className="mt-2 text-xs text-subtle">{t("error.reference", { x: error.digest })}</p>}
        <Button className="mt-6" onClick={reset}>{t("error.retry")}</Button>
      </div>
    </main>
  );
}
