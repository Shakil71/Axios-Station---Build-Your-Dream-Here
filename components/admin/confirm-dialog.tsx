"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { buttonVariants } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-bg-2 p-6 shadow-card">
          <AlertDialog.Title className="text-lg font-semibold text-fg">{title}</AlertDialog.Title>
          {description && <AlertDialog.Description className="mt-2 text-sm text-muted">{description}</AlertDialog.Description>}
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel className={buttonVariants({ variant: "ghost", size: "sm" })}>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action className={buttonVariants({ variant: destructive ? "danger" : "primary", size: "sm" })} onClick={onConfirm}>
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
