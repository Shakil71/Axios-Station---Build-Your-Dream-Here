"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { loginAction, requestPasswordResetAction, resetPasswordAction, type AuthState } from "@/actions/admin/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";

const initial: AuthState = { ok: false };

function Message({ state }: { state: AuthState }) {
  if (!state.message) return null;
  return (
    <p className={state.ok ? "rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success" : "rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"} role="alert">
      {state.message}
    </p>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/admin/reset-password" className="mb-1.5 text-xs text-brand-2 hover:underline">Forgot password?</Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <Message state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <LogIn />} Sign in
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Account email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <Message state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);
  if (state.ok) {
    return (
      <div className="space-y-4">
        <Message state={state} />
        <Link href="/admin/login" className="block text-center text-sm text-brand-2">Go to sign in</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required />
        <p className="mt-1.5 text-xs text-subtle">At least 12 characters, including letters and numbers.</p>
      </div>
      <div>
        <Label htmlFor="confirm">Confirm password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>
      <Message state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Update password
      </Button>
    </form>
  );
}
