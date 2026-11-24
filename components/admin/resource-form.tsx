"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { saveResourceAction } from "@/actions/admin/resource";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { GalleryField, MediaField, type MediaItem } from "./media-picker";
import { RichTextEditor } from "./rich-text-editor";
import { useToast } from "./toast";
import { ICON_NAMES, DynamicIcon } from "@/components/ui/icon";
import { cn, slugify } from "@/lib/utils";
import type { Field } from "@/lib/admin/resources";
import type { Result } from "@/actions/admin/guarded";

export type FormValues = Record<string, string | boolean | string[]>;

export function ResourceForm({
  resourceKey,
  id,
  fields,
  values,
  media,
  gallery,
  relationOptions,
  publicUrl,
}: {
  resourceKey: string;
  id: string | null;
  fields: Field[];
  values: FormValues;
  media: Record<string, MediaItem | null>;
  gallery: MediaItem[];
  relationOptions: Record<string, { value: string; label: string }[]>;
  publicUrl?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [dirty, setDirty] = useState(false);
  const action = useMemo(
    () => async (prev: Result, fd: FormData) => {
      const r = await saveResourceAction(resourceKey, id, prev, fd);
      if (r.ok) setDirty(false);
      return r;
    },
    [resourceKey, id],
  );
  const [state, formAction, pending] = useActionState<Result, FormData>(action, { ok: false });
  const [slugs, setSlugs] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.filter((f) => f.type === "slug").map((f) => [f.name, String(values[f.name] ?? "")])),
  );
  const slugTouched = useRef<Record<string, boolean>>(Object.fromEntries(fields.filter((f) => f.type === "slug").map((f) => [f.name, Boolean(id)])));
  const lastState = useRef(state);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.message) toast(state.ok, state.message);
    if (state.ok) {
      if (!id && state.id) router.replace(`/admin/content/${resourceKey}/${state.id}`);
      else router.refresh();
    }
  }, [state, id, resourceKey, router, toast]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function onSourceChange(name: string, value: string) {
    for (const f of fields) {
      if (f.type === "slug" && f.from === name && !slugTouched.current[f.name]) {
        setSlugs((s) => ({ ...s, [f.name]: slugify(value) }));
      }
    }
  }

  const errors = state.fieldErrors ?? {};
  const sections = [...new Set(fields.map((f) => f.section ?? "Details"))];

  function render(f: Field) {
    const err = errors[f.name]?.[0];
    const common = { id: f.name, name: f.name, "aria-invalid": !!err, required: f.required };
    const v = values[f.name];
    let input: React.ReactNode;
    switch (f.type) {
      case "text":
      case "url":
      case "email":
        input = (
          <Input
            {...common}
            type={f.type === "text" ? "text" : f.type}
            defaultValue={String(v ?? "")}
            placeholder={f.placeholder}
            maxLength={f.max}
            onChange={(e) => onSourceChange(f.name, e.target.value)}
          />
        );
        break;
      case "number":
        input = <Input {...common} type="number" defaultValue={String(v ?? "")} min={f.min} max={f.max} />;
        break;
      case "slug":
        input = (
          <Input
            {...common}
            value={slugs[f.name] ?? ""}
            onChange={(e) => {
              slugTouched.current[f.name] = true;
              setSlugs((s) => ({ ...s, [f.name]: e.target.value }));
              onSourceChange(f.name, e.target.value);
            }}
            className="font-mono text-[13px]"
          />
        );
        break;
      case "textarea":
        input = <Textarea {...common} defaultValue={String(v ?? "")} rows={4} maxLength={f.max} />;
        break;
      case "list":
        input = <Textarea {...common} defaultValue={String(v ?? "")} rows={5} placeholder="One item per line" />;
        break;
      case "items":
        input = <Textarea {...common} defaultValue={String(v ?? "")} rows={6} className="font-mono text-[13px]" placeholder="Title | Description" />;
        break;
      case "tags":
        input = <Input {...common} defaultValue={String(v ?? "")} placeholder="ai, automation, cloud" />;
        break;
      case "richtext":
        input = <RichTextEditor name={f.name} initial={String(v ?? "")} />;
        break;
      case "boolean":
        input = (
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name={f.name} defaultChecked={v === true} className="h-4 w-4 accent-[var(--brand)]" />
            {f.label}
          </label>
        );
        break;
      case "select":
      case "status":
        input = (
          <Select {...common} defaultValue={String(v ?? f.options?.[0]?.value ?? "")}>
            {!f.required && <option value="">—</option>}
            {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        );
        break;
      case "datetime":
        input = <Input {...common} type="datetime-local" defaultValue={String(v ?? "")} />;
        break;
      case "icon":
        input = <IconSelect name={f.name} initial={String(v ?? "")} />;
        break;
      case "relation":
        input = (
          <Select {...common} defaultValue={String(v ?? "")}>
            <option value="">{f.required ? "Select…" : "— None —"}</option>
            {(relationOptions[f.name] ?? []).filter((o) => o.value !== id).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        );
        break;
      case "relationMany": {
        const selected = new Set(Array.isArray(v) ? v : []);
        input = (
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border-strong p-3">
            {(relationOptions[f.name] ?? []).map((o) => (
              <label key={o.value} className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" name={f.name} value={o.value} defaultChecked={selected.has(o.value)} className="h-4 w-4 accent-[var(--brand)]" />
                {o.label}
              </label>
            ))}
          </div>
        );
        break;
      }
      case "media":
        input = <MediaField name={f.name} initial={media[f.name] ?? null} />;
        break;
      case "gallery":
        input = <GalleryField name={f.name} initial={gallery} />;
        break;
    }
    return (
      <div key={f.name} className={cn(f.colSpan === 2 || ["richtext", "gallery", "items"].includes(f.type) ? "md:col-span-2" : "")}>
        {f.type !== "boolean" && <Label htmlFor={f.name}>{f.label}{f.required && <span className="text-danger"> *</span>}</Label>}
        {input}
        {f.help && <p className="mt-1.5 text-xs text-subtle">{f.help}</p>}
        <FieldError>{err}</FieldError>
      </div>
    );
  }

  return (
    <form action={formAction} onChange={() => setDirty(true)} className="space-y-6" noValidate>
      {sections.map((s) => (
        <fieldset key={s} className="rounded-2xl border border-border bg-bg-2/60 p-5 sm:p-6">
          <legend className="px-2 text-sm font-semibold text-fg">{s}</legend>
          <div className="grid gap-5 md:grid-cols-2">{fields.filter((f) => (f.section ?? "Details") === s).map(render)}</div>
        </fieldset>
      ))}
      {state.message && !state.ok && <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{state.message}</p>}
      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-bg/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <span className="text-xs text-subtle">{dirty ? "Unsaved changes" : id ? "All changes saved" : "New item"}</span>
        <div className="flex gap-2">
          {publicUrl && (
            <a href={publicUrl} target="_blank" rel="noopener" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Preview <ExternalLink />
            </a>
          )}
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />} {id ? "Save changes" : "Create"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function IconSelect({ name, initial }: { name: string; initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-3 text-brand-2">
        <DynamicIcon name={value} className="h-5 w-5" />
      </span>
      <Select id={name} name={name} value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="">Default</option>
        {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
      </Select>
    </div>
  );
}
