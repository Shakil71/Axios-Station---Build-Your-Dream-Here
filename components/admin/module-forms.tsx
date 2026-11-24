"use client";

import { Fragment, useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Eye, EyeOff, FileText, Loader2, Save, Trash2, Upload } from "lucide-react";
import {
  deleteMediaAction, maintenanceAction, saveRolePermissionsAction, saveSectionAction, saveSettingsAction, saveUserAction,
  sectionOpAction, subscriberAction, updateMediaAction, userOpAction, addSectionAction,
} from "@/actions/admin/modules";
import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { ConfirmDialog } from "./confirm-dialog";
import { MediaField, uploadFile, type MediaItem } from "./media-picker";
import { useToast } from "./toast";
import { cn } from "@/lib/utils";
import type { Result } from "@/actions/admin/guarded";
import type { SettingField } from "@/lib/settings-schema";

function useResultToast(state: Result, onOk?: (s: Result) => void) {
  const toast = useToast();
  const last = useRef(state);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.message) toast(state.ok, state.message);
    if (state.ok) onOk?.(state);
  }, [state, toast, onOk]);
}

/** A button that runs a server action, optionally behind a confirmation dialog. */
export function ActionButton({
  run,
  label,
  confirm,
  variant = "secondary",
  icon,
}: {
  run: () => Promise<Result>;
  label: string;
  confirm?: { title: string; description?: string; destructive?: boolean };
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const go = () =>
    start(async () => {
      const r = await run();
      toast(r.ok, r.message ?? (r.ok ? "Done." : "Failed."));
      if (r.ok) router.refresh();
    });
  return (
    <>
      <Button type="button" size="sm" variant={variant} disabled={pending} onClick={() => (confirm ? setOpen(true) : go())}>
        {pending ? <Loader2 className="animate-spin" /> : icon} {label}
      </Button>
      {confirm && (
        <ConfirmDialog open={open} onOpenChange={setOpen} title={confirm.title} description={confirm.description} destructive={confirm.destructive} confirmLabel={label} onConfirm={go} />
      )}
    </>
  );
}

// ── Settings ────────────────────────────────────────────────

export function SettingsForm({ group, fields, values }: { group: string; fields: SettingField[]; values: Record<string, unknown> }) {
  const action = useMemo(() => saveSettingsAction.bind(null, group), [group]);
  const [state, formAction, pending] = useActionState<Result, FormData>(action, { ok: false });
  useResultToast(state);
  const e = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-border bg-bg-2/60 p-5 sm:p-6">
      {fields.map((f) => {
        const v = values[f.key];
        return (
          <div key={f.key}>
            {f.type === "boolean" ? (
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" name={f.key} defaultChecked={v === true} className="h-4 w-4 accent-[var(--brand)]" /> {f.label}
              </label>
            ) : (
              <>
                <Label htmlFor={f.key}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea id={f.key} name={f.key} defaultValue={String(v ?? "")} rows={3} />
                ) : f.type === "list" ? (
                  <Textarea id={f.key} name={f.key} defaultValue={Array.isArray(v) ? v.join("\n") : ""} rows={5} placeholder="One per line" />
                ) : f.type === "select" ? (
                  <Select id={f.key} name={f.key} defaultValue={String(v ?? "")}>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                ) : (
                  <Input id={f.key} name={f.key} type={f.type === "email" ? "email" : f.type === "url" ? "url" : "text"} defaultValue={String(v ?? "")} />
                )}
              </>
            )}
            {f.help && <p className="mt-1.5 text-xs text-subtle">{f.help}</p>}
            <FieldError>{e[f.key]?.[0]}</FieldError>
          </div>
        );
      })}
      <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Save settings</Button>
    </form>
  );
}

// ── Homepage builder ────────────────────────────────────────

export type SectionView = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  cta2Label: string;
  cta2Href: string;
  image: MediaItem | null;
  items: string;
  list: string;
  stats: string;
  limit: string;
  isEnabled: boolean;
};

const SECTION_HINTS: Record<string, { items?: string; list?: string; stats?: boolean; limit?: boolean; image?: boolean; cta?: boolean }> = {
  hero: { list: "Labels on the animated hero graphic (5, in order)", image: true, cta: true },
  intro: { list: "Highlight points", stats: true, image: true, cta: true },
  services: { limit: true, cta: true },
  capabilities: { items: "Capabilities — Title | Description" },
  solutions: { limit: true, cta: true },
  industries: { cta: true },
  projects: { limit: true, cta: true },
  why: { items: "Reasons — Title | Description", image: true },
  showcase: { list: "Highlight points", stats: true, image: true, cta: true },
  process: { items: "Steps — Title | Description" },
  team: { limit: true, cta: true },
  testimonials: { limit: true },
  techstack: { items: "Groups — Group | tech, tech, tech" },
  blog: { limit: true, cta: true },
  cta: { cta: true, image: true },
  newsletter: {},
  mission: {},
  vision: {},
  philosophy: {},
  values: { items: "Values — Title | Description" },
  milestones: { items: "Milestones — Year/Title | Description" },
};

export function SectionEditor({ s, index, count, translation }: { s: SectionView; index: number; count: number; translation?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const action = useMemo(() => saveSectionAction.bind(null, s.id), [s.id]);
  const [state, formAction, pending] = useActionState<Result, FormData>(action, { ok: false });
  const router = useRouter();
  useResultToast(state, () => router.refresh());
  const hint = SECTION_HINTS[s.type] ?? { items: "Items — Title | Description", list: "List", cta: true };

  return (
    <div className={cn("rounded-2xl border bg-bg-2/60", s.isEnabled ? "border-border" : "border-dashed border-border opacity-80")}>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold tabular-nums text-muted">{index + 1}</span>
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left cursor-pointer">
          <span className="block text-xs font-semibold uppercase tracking-wider text-brand-2">{s.type}</span>
          <span className="block truncate font-medium">{s.title || "(untitled)"}</span>
        </button>
        <div className="flex items-center gap-1">
          <ActionButton variant="ghost" label="" icon={<ChevronUp />} run={() => (index > 0 ? sectionOpAction(s.id, "up") : Promise.resolve({ ok: false, message: "Already first." }))} />
          <ActionButton variant="ghost" label="" icon={<ChevronDown />} run={() => (index < count - 1 ? sectionOpAction(s.id, "down") : Promise.resolve({ ok: false, message: "Already last." }))} />
          <ActionButton variant="ghost" label={s.isEnabled ? "Hide" : "Show"} icon={s.isEnabled ? <EyeOff /> : <Eye />} run={() => sectionOpAction(s.id, "toggle")} />
          <ActionButton variant="ghost" label="" icon={<Trash2 />} run={() => sectionOpAction(s.id, "delete")} confirm={{ title: `Remove the ${s.type} section?`, description: "Its content will be deleted.", destructive: true }} />
          <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Edit"}</Button>
        </div>
      </div>
      {open && (
        <form action={formAction} className="grid gap-4 border-t border-border p-4 md:grid-cols-2">
          <div><Label htmlFor={`${s.id}-subtitle`}>Eyebrow / subtitle</Label><Input id={`${s.id}-subtitle`} name="subtitle" defaultValue={s.subtitle} /></div>
          <div><Label htmlFor={`${s.id}-title`}>Title</Label><Input id={`${s.id}-title`} name="title" defaultValue={s.title} /></div>
          <div className="md:col-span-2"><Label htmlFor={`${s.id}-description`}>Description</Label><Textarea id={`${s.id}-description`} name="description" defaultValue={s.description} rows={3} /></div>
          {hint.cta !== false && (
            <>
              <div><Label>Primary button label</Label><Input name="ctaLabel" defaultValue={s.ctaLabel} /></div>
              <div><Label>Primary button link</Label><Input name="ctaHref" defaultValue={s.ctaHref} placeholder="/contact" /></div>
              <div><Label>Secondary button label</Label><Input name="cta2Label" defaultValue={s.cta2Label} /></div>
              <div><Label>Secondary button link</Label><Input name="cta2Href" defaultValue={s.cta2Href} placeholder="/solutions" /></div>
            </>
          )}
          {hint.cta === false || !hint.cta ? (
            <>
              <input type="hidden" name="ctaLabel" value={s.ctaLabel} /><input type="hidden" name="ctaHref" value={s.ctaHref} />
              <input type="hidden" name="cta2Label" value={s.cta2Label} /><input type="hidden" name="cta2Href" value={s.cta2Href} />
            </>
          ) : null}
          {hint.items ? (
            <div className="md:col-span-2"><Label>{hint.items}</Label><Textarea name="items" defaultValue={s.items} rows={6} className="font-mono text-[13px]" /></div>
          ) : <input type="hidden" name="items" value={s.items} />}
          {hint.list ? (
            <div className="md:col-span-2"><Label>{hint.list} (one per line)</Label><Textarea name="list" defaultValue={s.list} rows={4} /></div>
          ) : <input type="hidden" name="list" value={s.list} />}
          {hint.stats ? (
            <div className="md:col-span-2">
              <Label>Statistics (one per line: Value | Label)</Label>
              <Textarea name="stats" defaultValue={s.stats} rows={3} className="font-mono text-[13px]" placeholder="e.g. 24/7 | Support" />
              <p className="mt-1.5 text-xs text-subtle">Only publish verified figures. Leave empty to hide the stats row.</p>
            </div>
          ) : <input type="hidden" name="stats" value={s.stats} />}
          {hint.limit ? (
            <div><Label>Number of items to show</Label><Input name="limit" type="number" min={1} max={24} defaultValue={s.limit} /></div>
          ) : <input type="hidden" name="limit" value={s.limit} />}
          {hint.image ? (
            <div className="md:col-span-2">
              <Label>Image (optional — replaces the default visual)</Label>
              <MediaField name="imageId" initial={s.image} />
            </div>
          ) : <input type="hidden" name="imageId" value={s.image?.id ?? ""} />}
          <div className="md:col-span-2">
            <Button type="submit" size="sm" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Save section</Button>
          </div>
        </form>
      )}
      {open && translation && <div className="border-t border-border p-4">{translation}</div>}
    </div>
  );
}

export function AddSectionForm({ pageKey, types }: { pageKey: string; types: string[] }) {
  const [type, setType] = useState(types[0] ?? "");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={type} onChange={(e) => setType(e.target.value)} className="w-48" aria-label="Section type">
        {types.map((t) => <option key={t} value={t}>{t}</option>)}
      </Select>
      <ActionButton label="Add section" run={() => addSectionAction(pageKey, type)} />
    </div>
  );
}

// ── Users ───────────────────────────────────────────────────

export function UserForm({ user, roles }: { user: { id: string; name: string; email: string; isActive: boolean; roleIds: string[] } | null; roles: { id: string; name: string; description: string | null }[] }) {
  const action = useMemo(() => saveUserAction.bind(null, user?.id ?? null), [user?.id]);
  const [state, formAction, pending] = useActionState<Result, FormData>(action, { ok: false });
  const router = useRouter();
  useResultToast(state, (s) => {
    if (!user && s.id) router.replace(`/admin/users/${s.id}`);
    else router.refresh();
  });
  const e = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-border bg-bg-2/60 p-5 sm:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div><Label htmlFor="name">Name *</Label><Input id="name" name="name" defaultValue={user?.name} required /><FieldError>{e.name?.[0]}</FieldError></div>
        <div><Label htmlFor="email">Email *</Label><Input id="email" name="email" type="email" defaultValue={user?.email} required /><FieldError>{e.email?.[0]}</FieldError></div>
        <div className="md:col-span-2">
          <Label htmlFor="password">{user ? "New password (leave blank to keep)" : "Password *"}</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={user ? undefined : 12} />
          <p className="mt-1.5 text-xs text-subtle">At least 12 characters with letters and numbers. Changing it signs the user out everywhere.</p>
          <FieldError>{e.password?.[0]}</FieldError>
        </div>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Roles *</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((r) => (
            <label key={r.id} className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
              <input type="checkbox" name="roleIds" value={r.id} defaultChecked={user?.roleIds.includes(r.id)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
              <span><span className="block font-medium">{r.name}</span><span className="text-xs text-muted">{r.description}</span></span>
            </label>
          ))}
        </div>
        <FieldError>{e.roleIds?.[0]}</FieldError>
      </fieldset>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={user?.isActive ?? true} className="h-4 w-4 accent-[var(--brand)]" /> Active (can sign in)
      </label>
      {state.message && !state.ok && <p className="text-sm text-danger" role="alert">{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} {user ? "Save user" : "Create user"}</Button>
    </form>
  );
}

export function UserOps({ id }: { id: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton label="Sign out everywhere" run={() => userOpAction(id, "revoke")} confirm={{ title: "Sign this user out of all sessions?" }} />
      <ActionButton
        label="Delete user"
        variant="danger"
        icon={<Trash2 />}
        run={async () => {
          const r = await userOpAction(id, "delete");
          if (r.ok) router.push("/admin/users");
          return r;
        }}
        confirm={{ title: "Delete this user?", description: "They will lose access immediately. Their past activity remains in the logs.", destructive: true }}
      />
    </div>
  );
}

// ── Roles matrix ────────────────────────────────────────────

export function RolesMatrix({ roles, permissions, granted }: { roles: { id: string; key: string; name: string }[]; permissions: { key: string; description: string | null; group: string }[]; granted: Record<string, string[]> }) {
  const [state, formAction, pending] = useActionState<Result, FormData>(saveRolePermissionsAction, { ok: false });
  useResultToast(state);
  const groups = [...new Set(permissions.map((p) => p.group))];
  return (
    <form action={formAction}>
      <div className="overflow-x-auto rounded-2xl border border-border bg-bg-2/50">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-subtle">Permission</th>
              {roles.map((r) => <th key={r.id} className="px-3 py-3 text-center text-xs font-semibold">{r.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g}>
                <tr className="bg-surface"><td colSpan={roles.length + 1} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-brand-2">{g}</td></tr>
                {permissions.filter((p) => p.group === g).map((p) => (
                  <tr key={p.key} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5"><span className="font-mono text-xs">{p.key}</span><p className="text-xs text-muted">{p.description}</p></td>
                    {roles.map((r) => (
                      <td key={r.id} className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          name={`role:${r.id}`}
                          value={p.key}
                          defaultChecked={r.key === "super_admin" || granted[r.id]?.includes(p.key)}
                          disabled={r.key === "super_admin"}
                          aria-label={`${r.name}: ${p.key}`}
                          className="h-4 w-4 accent-[var(--brand)]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="submit" className="mt-4" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Save permissions</Button>
    </form>
  );
}

// ── Media library ───────────────────────────────────────────

export type LibraryItem = MediaItem & { title: string | null; caption: string | null; sizeBytes: number; mimeType: string; createdAt: string; refs: { type: string; label: string; href: string }[] };

export function MediaUploader() {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      try {
        await uploadFile(f);
        ok++;
      } catch (e) {
        toast(false, `${f.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
    }
    setBusy(false);
    if (ok) {
      toast(true, `Uploaded ${ok} file${ok > 1 ? "s" : ""}.`);
      router.refresh();
    }
    if (input.current) input.current.value = "";
  }
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
      className={cn("flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition", drag ? "border-brand bg-brand/10" : "border-border-strong")}
    >
      <Upload className="h-6 w-6 text-brand-2" />
      <p className="mt-3 text-sm font-medium">Drag & drop files here</p>
      <p className="mt-1 text-xs text-subtle">JPG, PNG, WebP, AVIF, GIF, PDF, DOCX, XLSX, PPTX. Images are optimised to WebP and stripped of metadata.</p>
      <input ref={input} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} accept="image/jpeg,image/png,image/webp,image/avif,image/gif,.pdf,.docx,.xlsx,.pptx" />
      <Button type="button" size="sm" className="mt-4" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />} Choose files
      </Button>
    </div>
  );
}

export function MediaDetail({ m }: { m: LibraryItem }) {
  const action = useMemo(() => updateMediaAction.bind(null, m.id), [m.id]);
  const [state, formAction, pending] = useActionState<Result, FormData>(action, { ok: false });
  const router = useRouter();
  useResultToast(state, () => router.refresh());
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-bg-3 p-4">
        {m.kind === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.url} alt={m.altText ?? ""} className="max-h-[60vh] w-auto rounded-lg" />
        ) : (
          <a href={m.url} target="_blank" rel="noopener" className="flex flex-col items-center gap-3 p-10 text-muted hover:text-fg"><FileText className="h-12 w-12" /> Open document</a>
        )}
      </div>
      <div className="space-y-5">
        <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-bg-2/60 p-5">
          <div><Label htmlFor="altText">Alt text</Label><Input id="altText" name="altText" defaultValue={m.altText ?? ""} placeholder="Describe the image for screen readers & SEO" /></div>
          <div><Label htmlFor="title">Title</Label><Input id="title" name="title" defaultValue={m.title ?? ""} /></div>
          <div><Label htmlFor="caption">Caption</Label><Textarea id="caption" name="caption" defaultValue={m.caption ?? ""} rows={3} /></div>
          <Button type="submit" size="sm" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Save details</Button>
        </form>
        <dl className="space-y-2 rounded-2xl border border-border bg-bg-2/60 p-5 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-subtle">File</dt><dd className="truncate">{m.originalName}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-subtle">Type</dt><dd>{m.mimeType}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-subtle">Size</dt><dd>{(m.sizeBytes / 1024).toFixed(0)} KB</dd></div>
          {m.width && <div className="flex justify-between gap-4"><dt className="text-subtle">Dimensions</dt><dd>{m.width} × {m.height}</dd></div>}
          <div className="flex justify-between gap-4"><dt className="text-subtle">URL</dt><dd className="truncate font-mono text-xs">{m.url}</dd></div>
        </dl>
        <div className="rounded-2xl border border-border bg-bg-2/60 p-5">
          <p className="text-sm font-semibold">Used in</p>
          {m.refs.length === 0 ? <p className="mt-2 text-sm text-muted">Not used anywhere.</p> : (
            <ul className="mt-2 space-y-1 text-sm">
              {m.refs.map((r, i) => <li key={i}><a href={r.href} className="text-brand-2 hover:underline">{r.type}: {r.label}</a></li>)}
            </ul>
          )}
          <div className="mt-4">
            <ActionButton
              label="Delete file"
              variant="danger"
              icon={<Trash2 />}
              run={async () => {
                const r = await deleteMediaAction(m.id);
                if (r.ok) router.push("/admin/media");
                return r;
              }}
              confirm={{ title: "Delete this file?", description: m.refs.length ? "It is still in use, so deletion will be blocked until it is removed from that content." : "This permanently deletes the file.", destructive: true }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Misc ────────────────────────────────────────────────────

export function SubscriberOps({ id, status }: { id: string; status: string }) {
  return (
    <div className="flex justify-end gap-1">
      {status === "SUBSCRIBED" ? (
        <ActionButton variant="ghost" label="Unsubscribe" run={() => subscriberAction(id, "unsubscribe")} />
      ) : (
        <ActionButton variant="ghost" label="Resubscribe" run={() => subscriberAction(id, "resubscribe")} confirm={{ title: "Resubscribe this address?", description: "Only do this if the person asked to be resubscribed." }} />
      )}
      <ActionButton variant="ghost" label="" icon={<Trash2 />} run={() => subscriberAction(id, "delete")} confirm={{ title: "Delete subscriber?", description: "Removes the email permanently (e.g. for a data deletion request).", destructive: true }} />
    </div>
  );
}

export function MaintenanceButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton label="Clear cache & revalidate site" run={() => maintenanceAction("flush-cache")} confirm={{ title: "Clear all public caches?", description: "Pages will be rebuilt on next visit." }} />
      <ActionButton label="Publish due scheduled posts" run={() => maintenanceAction("publish-scheduled")} />
      <ActionButton label="Purge analytics > 12 months" run={() => maintenanceAction("purge-analytics")} confirm={{ title: "Delete old analytics events?", destructive: true }} />
      <ActionButton label="Purge login attempts > 90 days" run={() => maintenanceAction("purge-login-attempts")} confirm={{ title: "Delete old login attempt records?", destructive: true }} />
    </div>
  );
}

export { buttonVariants };
