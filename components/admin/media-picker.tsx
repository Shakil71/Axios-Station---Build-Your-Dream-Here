"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MediaItem = { id: string; url: string; kind: string; originalName: string; altText: string | null; width?: number | null; height?: number | null };

export async function uploadFile(file: File, altText = ""): Promise<MediaItem> {
  const fd = new FormData();
  fd.set("file", file);
  if (altText) fd.set("altText", altText);
  const res = await fetch("/api/admin/media", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json as MediaItem;
}

/** Modal for browsing, searching and uploading media. */
export function MediaPickerDialog({ open, onClose, onSelect, kind = "IMAGE" }: { open: boolean; onClose: () => void; onSelect: (m: MediaItem) => void; kind?: "IMAGE" | "DOCUMENT" | "" }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media?q=${encodeURIComponent(query)}${kind ? `&kind=${kind}` : ""}`, { cache: "no-store" });
      const json = await res.json();
      setItems(json.items ?? []);
    } catch {
      setError("Could not load media.");
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => load(q), 250);
    return () => clearTimeout(t);
  }, [open, q, load]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const m = await uploadFile(files[0]!);
      onSelect(m);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Media library">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-2 shadow-card">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search media…"
            className="h-10 flex-1 rounded-xl border border-border-strong bg-bg px-3 text-sm"
            autoFocus
          />
          <input ref={input} type="file" className="hidden" accept={kind === "DOCUMENT" ? ".pdf,.docx,.xlsx,.pptx" : "image/jpeg,image/png,image/webp,image/avif,image/gif"} onChange={(e) => onFiles(e.target.files)} />
          <Button type="button" size="sm" onClick={() => input.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />} Upload
          </Button>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-surface-2 cursor-pointer" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && <p className="border-b border-border bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && items.length === 0 ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-subtle" /></div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">No media yet. Upload your first file.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {items.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelect(m);
                    onClose();
                  }}
                  className="group overflow-hidden rounded-xl border border-border text-left transition hover:border-brand cursor-pointer"
                >
                  <div className="aspect-square bg-bg-3">
                    {m.kind === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt={m.altText ?? ""} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><FileText className="h-8 w-8 text-subtle" /></div>
                    )}
                  </div>
                  <p className="truncate px-2 py-1.5 text-xs text-muted">{m.originalName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Single-image field with preview. Submits the media id under `name`. */
export function MediaField({ name, initial }: { name: string; initial: MediaItem | null }) {
  const [value, setValue] = useState<MediaItem | null>(initial);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      <div className={cn("flex items-center gap-4 rounded-xl border border-dashed border-border-strong p-3", value && "border-solid")}>
        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-bg-3">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt={value.altText ?? ""} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><ImagePlus className="h-5 w-5 text-subtle" /></div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-sm">{value?.originalName ?? "No image selected"}</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>{value ? "Change" : "Choose image"}</Button>
            {value && <Button type="button" size="sm" variant="ghost" onClick={() => setValue(null)}>Remove</Button>}
          </div>
        </div>
      </div>
      <MediaPickerDialog open={open} onClose={() => setOpen(false)} onSelect={setValue} />
    </div>
  );
}

/** Ordered multi-image field (project gallery). Submits repeated `name` values. */
export function GalleryField({ name, initial }: { name: string; initial: MediaItem[] }) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [open, setOpen] = useState(false);
  const move = (i: number, d: -1 | 1) =>
    setItems((arr) => {
      const n = [...arr];
      const j = i + d;
      if (j < 0 || j >= n.length) return arr;
      [n[i], n[j]] = [n[j]!, n[i]!];
      return n;
    });
  return (
    <div>
      {items.map((m) => <input key={m.id} type="hidden" name={name} value={m.id} />)}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((m, i) => (
          <div key={m.id} className="group relative overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.altText ?? ""} className="aspect-[4/3] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <button type="button" onClick={() => move(i, -1)} className="px-2 text-xs text-white cursor-pointer" aria-label="Move left">←</button>
              <button type="button" onClick={() => setItems((a) => a.filter((x) => x.id !== m.id))} className="px-2 text-xs text-white cursor-pointer">Remove</button>
              <button type="button" onClick={() => move(i, 1)} className="px-2 text-xs text-white cursor-pointer" aria-label="Move right">→</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setOpen(true)} className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border-strong text-sm text-muted hover:border-brand hover:text-fg cursor-pointer">
          <ImagePlus className="mr-2 h-4 w-4" /> Add image
        </button>
      </div>
      <MediaPickerDialog open={open} onClose={() => setOpen(false)} onSelect={(m) => setItems((a) => (a.some((x) => x.id === m.id) ? a : [...a, m]))} />
    </div>
  );
}
