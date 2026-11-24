"use client";

import { useSyncExternalStore } from "react";

/** Current `data-theme` on <html>, kept in sync via MutationObserver. */
export function useHtmlTheme(): "dark" | "light" | null {
  return useSyncExternalStore(
    (cb) => {
      const obs = new MutationObserver(cb);
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => obs.disconnect();
    },
    () => (document.documentElement.dataset.theme === "light" ? "light" : "dark"),
    () => null,
  );
}

const listeners = new Set<() => void>();

/** A localStorage value that re-renders on change (same tab via notify(), other tabs via `storage`). */
export function useLocalStorage(key: string): string | null | undefined {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
}

export function setLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked */
  }
  listeners.forEach((l) => l());
}
