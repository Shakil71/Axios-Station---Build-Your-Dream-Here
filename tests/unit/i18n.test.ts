import { describe, expect, it } from "vitest";
import { localeFromPath, localizeHref, stripLocale, t } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n/dictionary";
import { parseItems, parseList, parseStats, TRANSLATABLE, RESOURCE_ENTITY } from "@/lib/i18n/translatable";

describe("i18n URLs", () => {
  it("prefixes internal links for Bengali and keeps English clean", () => {
    expect(localizeHref("/services", "bn")).toBe("/bn/services");
    expect(localizeHref("/", "bn")).toBe("/bn");
    expect(localizeHref("/contact?service=ERP", "bn")).toBe("/bn/contact?service=ERP");
    expect(localizeHref("/bn/services", "en")).toBe("/services");
    expect(localizeHref("/services", "en")).toBe("/services");
  });

  it("never touches admin, API, files, external or anchor links", () => {
    for (const href of ["/admin", "/api/health", "/images/a.webp", "/sitemap.xml", "https://example.com", "#top", "mailto:a@b.c", "//evil.com"]) {
      expect(localizeHref(href, "bn")).toBe(href);
    }
  });

  it("strips and detects the locale prefix", () => {
    expect(stripLocale("/bn/services/x")).toBe("/services/x");
    expect(stripLocale("/bn")).toBe("/");
    expect(stripLocale("/bnx")).toBe("/bnx");
    expect(localeFromPath("/bn/team")).toBe("bn");
    expect(localeFromPath("/bnx")).toBe("en");
    expect(localeFromPath("/team")).toBe("en");
  });
});

describe("dictionary", () => {
  it("has a Bengali string for every English key", () => {
    const missing = Object.keys(dictionaries.en).filter((k) => !(dictionaries.bn as Record<string, string>)[k]?.trim());
    expect(missing).toEqual([]);
  });

  it("keeps placeholders consistent between languages", () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    for (const [k, v] of Object.entries(dictionaries.en)) expect(ph((dictionaries.bn as Record<string, string>)[k]!), k).toBe(ph(v));
  });

  it("fills placeholders", () => {
    expect(t("en", "common.minRead", { n: 5 })).toBe("5 min read");
    expect(t("bn", "common.minRead", { n: 5 })).toBe("5 মিনিটের পড়া");
  });
});

describe("translation formats", () => {
  it("parses lists, items and stats like the admin editor", () => {
    expect(parseList(" a \n\n b ")).toEqual(["a", "b"]);
    expect(parseItems("Title | Desc | more\nOnly title")).toEqual([
      { title: "Title", description: "Desc | more" },
      { title: "Only title", description: "" },
    ]);
    expect(parseStats("২০২৪ | প্রতিষ্ঠা\nbad")).toEqual([{ value: "২০২৪", label: "প্রতিষ্ঠা" }]);
  });

  it("maps every translatable admin resource to a configured entity", () => {
    for (const entity of Object.values(RESOURCE_ENTITY)) expect(TRANSLATABLE[entity]?.length, entity).toBeGreaterThan(0);
  });
});
