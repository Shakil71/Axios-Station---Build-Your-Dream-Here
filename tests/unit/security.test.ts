import { describe, expect, it } from "vitest";
import { buildStorageKey, detectFileType, sanitizeFilename } from "@/lib/security/upload";
import { sanitizeRichText, stripHtml } from "@/lib/security/sanitize";
import { hashPassword, passwordPolicyError, verifyPassword } from "@/lib/security/password";
import { rateLimit, resetRateLimit } from "@/lib/security/rate-limit";
import { toCsv } from "@/lib/csv";

describe("upload validation", () => {
  it("detects real types from magic bytes, not the extension", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(detectFileType(png, "evil.pdf")?.mime).toBe("image/png");
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(detectFileType(jpg, "x.jpg")?.kind).toBe("IMAGE");
    const pdf = Buffer.from("%PDF-1.7 rest");
    expect(detectFileType(pdf, "doc.pdf")?.mime).toBe("application/pdf");
  });

  it("rejects HTML, SVG, executables and unknown zips", () => {
    expect(detectFileType(Buffer.from("<svg onload=alert(1)>"), "x.svg")).toBeNull();
    expect(detectFileType(Buffer.from("<html><script>"), "x.png")).toBeNull();
    expect(detectFileType(Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0]), "x.exe")).toBeNull();
    expect(detectFileType(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]), "x.jar")).toBeNull();
    expect(detectFileType(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]), "report.docx")?.ext).toBe("docx");
  });

  it("sanitises filenames and prevents path traversal", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("..\\..\\win.ini")).toBe("win.ini");
    expect(sanitizeFilename("my photo<script>.png")).toBe("my-photoscript.png");
    expect(sanitizeFilename("")).toBe("file");
  });

  it("builds non-guessable, dated storage keys", () => {
    const key = buildStorageKey("Server Room.JPG", "webp", new Date("2026-03-05T00:00:00Z"));
    expect(key).toMatch(/^2026\/03\/[a-f0-9]{16}-server-room\.webp$/);
  });
});

describe("HTML sanitisation", () => {
  it("removes scripts, event handlers and javascript: URLs", () => {
    const out = sanitizeRichText('<p onclick="x()">Hi<script>alert(1)</script><a href="javascript:alert(1)">x</a><img src=x onerror=alert(1)></p>');
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
    expect(out).toContain("<p>Hi");
  });

  it("hardens external links", () => {
    expect(sanitizeRichText('<a href="https://example.com">e</a>')).toContain('rel="noopener noreferrer nofollow"');
  });

  it("strips all tags for plain text", () => {
    expect(stripHtml("<b>Bold</b> <i>text</i>")).toBe("Bold text");
  });
});

describe("passwords", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("correct horse 42 battery");
    expect(hash).not.toContain("correct");
    expect(await verifyPassword("correct horse 42 battery", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("enforces the password policy", () => {
    expect(passwordPolicyError("short1")).toBeTruthy();
    expect(passwordPolicyError("onlylettersnodigits")).toBeTruthy();
    expect(passwordPolicyError("long-enough-pass-123")).toBeNull();
  });
});

describe("rate limiting (in-memory fallback)", () => {
  it("blocks after the limit", async () => {
    const id = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) expect((await rateLimit("unit", id, 3, 60)).allowed).toBe(true);
    const blocked = await rateLimit("unit", id, 3, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("reset clears the counter (successful login)", async () => {
    const id = `r-${Math.random()}`;
    for (let i = 0; i < 3; i++) await rateLimit("unit", id, 3, 60);
    expect((await rateLimit("unit", id, 3, 60)).allowed).toBe(false);
    await resetRateLimit("unit", id);
    expect((await rateLimit("unit", id, 3, 60)).allowed).toBe(true);
  });
});

describe("CSV export", () => {
  it("escapes quotes/commas and neutralises spreadsheet formulas", () => {
    const csv = toCsv(["a", "b"], [["=HYPERLINK(1)", 'say "hi", ok']]);
    expect(csv).toContain(`'=HYPERLINK(1)`);
    expect(csv).toContain(`"say ""hi"", ok"`);
  });
});
