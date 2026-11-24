"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, Languages, Loader2, Save } from "lucide-react";
import { saveTranslationsAction } from "@/actions/admin/translations";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/primitives";
import { RichTextEditor } from "./rich-text-editor";
import { useToast } from "./toast";
import { cn } from "@/lib/utils";
import type { Result } from "@/actions/admin/guarded";
import type { TranslationRow, TranslationTarget } from "@/services/admin/translations";

const FORMAT_HELP: Partial<Record<TranslationRow["kind"], string>> = {
  list: "One item per line.",
  items: "One per line: Title | Description",
  stats: "One per line: Value | Label",
};

const fieldName = (r: TranslationRow) => `tr::${r.entityId}::${r.field}`;

/**
 * Bengali version of a content item. Empty fields fall back to English on
 * the public /bn pages, so translation can be done gradually.
 */
export function TranslationPanel({
  target,
  rows,
  title = "Bengali translation (বাংলা)",
  defaultOpen = false,
  publicPath,
}: {
  target: TranslationTarget;
  rows: TranslationRow[];
  title?: string;
  defaultOpen?: boolean;
  publicPath?: string | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const action = useMemo(() => saveTranslationsAction.bind(null, target), [target]);
  const [state, formAction, pending] = useActionState<Result, FormData>(action, { ok: false });
  const toast = useToast();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(rows.map((r) => [fieldName(r), r.value])));
  const [editorKeys, setEditorKeys] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!state.message) return;
    toast(state.ok, state.message);
    if (state.ok) router.refresh();
  }, [state, toast, router]);

  const translated = rows.filter((r) => (values[fieldName(r)] ?? "").trim()).length;
  const relevant = rows.filter((r) => r.english.trim() || (values[fieldName(r)] ?? "").trim());
  const total = relevant.length;

  function copyEnglish(r: TranslationRow) {
    const name = fieldName(r);
    setValues((v) => ({ ...v, [name]: r.english }));
    if (r.kind === "richtext") setEditorKeys((k) => ({ ...k, [name]: (k[name] ?? 0) + 1 }));
  }

  return (
    <section className="rounded-2xl border border-brand/25 bg-bg-2/60" aria-label={title}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left cursor-pointer">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15 text-brand-2"><Languages className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          <span className="block text-xs text-muted">
            {translated}/{total} fields translated · empty fields show the English text on the Bengali site
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-subtle transition", open && "rotate-180")} />
      </button>
      {open && (
        <form action={formAction} className="space-y-5 border-t border-border p-4">
          {relevant.length === 0 && <p className="text-sm text-muted">Fill in the English content first, then add its Bengali version here.</p>}
          {relevant.map((r) => {
            const name = fieldName(r);
            const id = `tr-${r.entityId}-${r.field}`.replace(/[^a-zA-Z0-9_-]/g, "-");
            return (
              <div key={name} className="grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-subtle">English · {r.label}</p>
                  <div className="max-h-48 overflow-auto whitespace-pre-line rounded-xl border border-border bg-surface px-3 py-2 text-sm text-muted">
                    {r.kind === "richtext" ? r.english.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "—" : r.english || "—"}
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <Label htmlFor={id} className="mb-0">বাংলা · {r.label}</Label>
                    {r.english && (
                      <button type="button" onClick={() => copyEnglish(r)} className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg cursor-pointer" title="Copy the English text as a starting point (keeps the line format)">
                        <Copy className="h-3 w-3" /> Copy English
                      </button>
                    )}
                  </div>
                  {r.kind === "richtext" ? (
                    <RichTextEditor key={`${name}-${editorKeys[name] ?? 0}`} name={name} initial={values[name] ?? ""} />
                  ) : r.kind === "text" ? (
                    <Input id={id} name={name} lang="bn" value={values[name] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))} />
                  ) : (
                    <Textarea
                      id={id}
                      name={name}
                      lang="bn"
                      rows={Math.min(12, Math.max(3, r.english.split("\n").length + 1))}
                      value={values[name] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                    />
                  )}
                  {FORMAT_HELP[r.kind] && <p className="mt-1 text-xs text-subtle">{FORMAT_HELP[r.kind]}</p>}
                </div>
              </div>
            );
          })}
          {relevant.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="sm" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Save Bengali version</Button>
              {publicPath && (
                <a href={publicPath} target="_blank" rel="noopener" className="text-sm text-brand-2 underline">View Bengali page</a>
              )}
            </div>
          )}
        </form>
      )}
    </section>
  );
}
