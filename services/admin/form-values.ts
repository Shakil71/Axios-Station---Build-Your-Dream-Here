import "server-only";
import { prisma } from "@/lib/db/prisma";
import { asStringArray, asTitledItems } from "@/lib/utils";
import type { Resource } from "@/lib/admin/resources";
import type { FormValues } from "@/components/admin/resource-form";
import type { MediaItem } from "@/components/admin/media-picker";

function toLocalInput(d: unknown): string {
  if (!d) return "";
  const date = new Date(d as string);
  if (Number.isNaN(date.getTime())) return "";
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60_000).toISOString().slice(0, 16);
}

const mediaSelect = { id: true, url: true, kind: true, originalName: true, altText: true, width: true, height: true } as const;

/** Convert a DB record into values the client form understands. */
export async function toFormValues(resource: Resource, record: Record<string, unknown> | null) {
  const values: FormValues = {};
  const media: Record<string, MediaItem | null> = {};
  let gallery: MediaItem[] = [];
  const mediaIds: string[] = [];

  for (const f of resource.fields) {
    const v = record?.[f.name];
    switch (f.type) {
      case "boolean":
        values[f.name] = record ? v === true : f.name === "isEnabled";
        break;
      case "list":
        values[f.name] = asStringArray(v).join("\n");
        break;
      case "items":
        values[f.name] = asTitledItems(v).map((i) => (i.description ? `${i.title} | ${i.description}` : i.title)).join("\n");
        break;
      case "datetime":
        values[f.name] = toLocalInput(v);
        break;
      case "tags": {
        const tags = (record?.tags as { tag: { name: string } }[] | undefined) ?? [];
        values[f.name] = tags.map((t) => t.tag.name).join(", ");
        break;
      }
      case "relationMany": {
        const rel = (record?.[f.name] as Record<string, string>[] | undefined) ?? [];
        values[f.name] = rel.map((r) => r.serviceId ?? r.id ?? "").filter(Boolean);
        break;
      }
      case "media":
        if (typeof v === "string") mediaIds.push(v);
        values[f.name] = typeof v === "string" ? v : "";
        break;
      case "gallery":
        break;
      case "status":
        values[f.name] = typeof v === "string" ? v : "DRAFT";
        break;
      case "number":
        values[f.name] = v === null || v === undefined ? (f.name === "sortOrder" ? "0" : "") : String(v);
        break;
      default:
        values[f.name] = v === null || v === undefined ? "" : String(v);
    }
  }
  if (!record && resource.key === "redirects") values.statusCode = "301";

  const galleryRows = (record?.images as { mediaId: string }[] | undefined) ?? [];
  const allIds = [...new Set([...mediaIds, ...galleryRows.map((g) => g.mediaId)])];
  const found = allIds.length ? await prisma.media.findMany({ where: { id: { in: allIds } }, select: mediaSelect }) : [];
  const byId = new Map(found.map((m) => [m.id, m as MediaItem]));
  for (const f of resource.fields) if (f.type === "media") media[f.name] = byId.get(String(values[f.name])) ?? null;
  gallery = galleryRows.map((g) => byId.get(g.mediaId)).filter((m): m is MediaItem => Boolean(m));

  return { values, media, gallery };
}

/** Make a record safe to send to client components (Dates → ISO strings, drop heavy fields). */
export function serializeRow(row: Record<string, unknown>): Record<string, unknown> & { id: string } {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (["content", "body", "description", "passwordHash"].includes(k)) continue;
    if (v instanceof Date) out[k] = v.toISOString();
    else if (v && typeof v === "object" && !Array.isArray(v)) {
      const nested: Record<string, unknown> = {};
      for (const [nk, nv] of Object.entries(v as Record<string, unknown>)) {
        if (typeof nv === "string" || typeof nv === "number" || typeof nv === "boolean") nested[nk] = nv;
      }
      out[k] = nested;
    } else out[k] = v;
  }
  return out as Record<string, unknown> & { id: string };
}
