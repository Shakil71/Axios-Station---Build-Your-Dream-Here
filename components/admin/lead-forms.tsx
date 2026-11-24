"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Trash2 } from "lucide-react";
import { addLeadNoteAction, deleteLeadAction, replyLeadAction, updateLeadAction } from "@/actions/admin/leads";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { ConfirmDialog } from "./confirm-dialog";
import { useToast } from "./toast";
import type { Result } from "@/actions/admin/guarded";

function useResultToast(state: Result, onOk?: () => void) {
  const toast = useToast();
  const last = useRef(state);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.message) toast(state.ok, state.message);
    if (state.ok) onOk?.();
  }, [state, toast, onOk]);
}

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];

export function LeadStatusForm({ id, status, assignedToId, users, disabled }: { id: string; status: string; assignedToId: string | null; users: { id: string; name: string }[]; disabled: boolean }) {
  const action = useMemo(() => updateLeadAction.bind(null, id), [id]);
  const [state, formAction, pending] = useActionState<Result, FormData>(action, { ok: false });
  useResultToast(state);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue={status} disabled={disabled}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor="assignedToId">Assigned to</Label>
        <Select id="assignedToId" name="assignedToId" defaultValue={assignedToId ?? ""} disabled={disabled}>
          <option value="">Unassigned</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
      </div>
      {!disabled && <Button type="submit" size="sm" disabled={pending} className="w-full">{pending && <Loader2 className="animate-spin" />} Update lead</Button>}
    </form>
  );
}

export function LeadNoteForm({ id }: { id: string }) {
  const action = useMemo(() => addLeadNoteAction.bind(null, id), [id]);
  const [state, formAction, pending] = useActionState<Result, FormData>(action, { ok: false });
  const ref = useRef<HTMLFormElement>(null);
  useResultToast(state, () => ref.current?.reset());
  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <Textarea name="body" rows={3} placeholder="Add an internal note (not visible to the client)…" required />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>{pending && <Loader2 className="animate-spin" />} Add note</Button>
    </form>
  );
}

export function LeadReplyForm({ id, defaultSubject }: { id: string; defaultSubject: string }) {
  const action = useMemo(() => replyLeadAction.bind(null, id), [id]);
  const [state, formAction, pending] = useActionState<Result, FormData>(action, { ok: false });
  const ref = useRef<HTMLFormElement>(null);
  useResultToast(state, () => ref.current?.reset());
  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" defaultValue={defaultSubject} required />
      </div>
      <div>
        <Label htmlFor="body">Message</Label>
        <Textarea id="body" name="body" rows={6} required />
      </div>
      <Button type="submit" size="sm" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Send />} Send reply</Button>
    </form>
  );
}

export function DeleteLeadButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const toast = useToast();
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Trash2 /> Delete</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete this lead?"
        description="The lead will be removed from the pipeline."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          const r = await deleteLeadAction(id);
          toast(r.ok, r.message ?? "");
          if (r.ok) router.push("/admin/leads");
        }}
      />
    </>
  );
}
