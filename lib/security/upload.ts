import { randomBytes } from "node:crypto";

export type AllowedType = { mime: string; ext: string; kind: "IMAGE" | "DOCUMENT" };

/** Allow-list of upload types, verified by magic bytes — never by the client-sent MIME alone. */
const SIGNATURES: { type: AllowedType; test: (b: Buffer) => boolean }[] = [
  { type: { mime: "image/jpeg", ext: "jpg", kind: "IMAGE" }, test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: { mime: "image/png", ext: "png", kind: "IMAGE" },
    test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    type: { mime: "image/webp", ext: "webp", kind: "IMAGE" },
    test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  { type: { mime: "image/gif", ext: "gif", kind: "IMAGE" }, test: (b) => b.subarray(0, 4).toString("ascii") === "GIF8" },
  {
    type: { mime: "image/avif", ext: "avif", kind: "IMAGE" },
    test: (b) => b.subarray(4, 8).toString("ascii") === "ftyp" && /avi[fs]/.test(b.subarray(8, 12).toString("ascii")),
  },
  { type: { mime: "application/pdf", ext: "pdf", kind: "DOCUMENT" }, test: (b) => b.subarray(0, 5).toString("ascii") === "%PDF-" },
  {
    // DOCX / XLSX / PPTX are ZIP containers; the extension decides which.
    type: { mime: "application/zip", ext: "zip", kind: "DOCUMENT" },
    test: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  },
];

const OFFICE: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/** Detect the real file type from its bytes. SVG is deliberately not allowed (script risk). */
export function detectFileType(buf: Buffer, originalName: string): AllowedType | null {
  const sig = SIGNATURES.find((s) => s.test(buf));
  if (!sig) return null;
  if (sig.type.mime === "application/zip") {
    const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
    const mime = OFFICE[ext];
    return mime ? { mime, ext, kind: "DOCUMENT" } : null;
  }
  return sig.type;
}

/** Produce a safe display name: no paths, control chars or odd unicode. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.-]+/, "")
    .slice(0, 120);
  return cleaned || "file";
}

/** Build a non-guessable storage key, e.g. 2026/11/ab12cd…-server-room.jpg */
export function buildStorageKey(originalName: string, ext: string, now = new Date()): string {
  const stem = sanitizeFilename(originalName).replace(/\.[^.]+$/, "").toLowerCase().slice(0, 60) || "file";
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}/${m}/${randomBytes(8).toString("hex")}-${stem}.${ext}`;
}
