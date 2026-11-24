"use client";

import { Moon, Sun } from "lucide-react";
import { useHtmlTheme } from "@/hooks/use-dom-value";
import { useT } from "@/components/i18n/locale-provider";

export function ThemeToggle() {
  const theme = useHtmlTheme();
  const t = useT();

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("axs-theme", next);
    } catch {
      /* storage may be blocked */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg cursor-pointer"
      aria-label={theme === "light" ? t("theme.toDark") : t("theme.toLight")}
      title={t("theme.toggle")}
    >
      {theme === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </button>
  );
}
