import { describe, expect, it } from "vitest";
import { asStringArray, asTitledItems, readingMinutes, safeHref, slugify } from "@/lib/utils";
import { contactSchema } from "@/lib/validation/public";
import { invalidationMap, cacheKeys, CACHE_PREFIX } from "@/lib/redis/keys";

describe("utils", () => {
  it("slugify", () => {
    expect(slugify("AI Integration & Development")).toBe("ai-integration-and-development");
    expect(slugify("  Café  Déjà Vu!! ")).toBe("cafe-deja-vu");
  });

  it("safeHref blocks javascript: and protocol-relative URLs", () => {
    expect(safeHref("javascript:alert(1)")).toBe("#");
    expect(safeHref("//evil.com")).toBe("#");
    expect(safeHref("/services")).toBe("/services");
    expect(safeHref("https://example.com")).toBe("https://example.com");
  });

  it("reading time", () => {
    expect(readingMinutes("<p>" + "word ".repeat(660) + "</p>")).toBe(3);
    expect(readingMinutes("")).toBe(1);
  });

  it("coerces JSON safely", () => {
    expect(asStringArray(["a", 1, "", "b"])).toEqual(["a", "b"]);
    expect(asStringArray(null)).toEqual([]);
    expect(asTitledItems([{ title: "T", description: "D" }, { nope: 1 }, "x"])).toEqual([{ title: "T", description: "D" }]);
  });
});

describe("contact form validation", () => {
  const base = { name: "Jane Doe", email: "JANE@Example.com", message: "We need a hotel management system for 3 properties.", consent: "on", startedAt: "1700000000000" };

  it("accepts a valid submission and normalises email", () => {
    const r = contactSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("jane@example.com");
  });

  it("requires consent and a meaningful message", () => {
    expect(contactSchema.safeParse({ ...base, consent: undefined }).success).toBe(false);
    expect(contactSchema.safeParse({ ...base, message: "hi" }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...base, website: "http://spam" }).success).toBe(false);
  });
});

describe("cache keys & invalidation map", () => {
  it("all public keys share the public prefix", () => {
    expect(cacheKeys.service("x").startsWith(CACHE_PREFIX)).toBe(true);
    expect(cacheKeys.blogList("q").startsWith(CACHE_PREFIX)).toBe(true);
  });

  it("content changes invalidate the homepage", () => {
    for (const e of ["service", "project", "blog", "testimonial", "team"]) expect(invalidationMap[e]).toContain("page");
  });
});
