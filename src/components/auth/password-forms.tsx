"use client";

import { useActionState } from "react";
import { CircleAlert, Loader2, MailCheck } from "lucide-react";
import { forgotPasswordAction, resetPasswordAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

const initialState: AuthState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState);
  return (
    <div>
      {state.error && <p className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><CircleAlert className="size-4" /> {state.error}</p>}
      {state.message && <p className="mb-4 flex items-center gap-2 rounded-lg bg-signal-50 p-3 text-sm text-link-ink"><MailCheck className="size-4" /> {state.message}</p>}
      <form action={action} className="space-y-4">
        <Field label="Email address" required>
          <Input name="email" type="email" placeholder="you@example.com" required />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <><Loader2 className="animate-spin" /> Sending…</> : "Send reset link"}
        </Button>
      </form>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);
  return (
    <div>
      {state.error && <p className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><CircleAlert className="size-4" /> {state.error}</p>}
      <form action={action} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <Field label="New password" required>
          <Input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <><Loader2 className="animate-spin" /> Updating…</> : "Update password"}
        </Button>
      </form>
    </div>
  );
}
