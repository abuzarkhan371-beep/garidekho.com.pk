"use client";

import { useActionState, useState } from "react";
import { CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { registerAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

const initialState: AuthState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      {state.error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <CircleAlert className="size-4 shrink-0" /> {state.error}
        </p>
      )}
      <form action={action} className="space-y-4">
        <Field label="Full name" error={state.fieldErrors?.name} required>
          <Input name="name" autoComplete="name" placeholder="Ahmed Raza" required />
        </Field>
        <Field label="Email address" error={state.fieldErrors?.email} required>
          <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </Field>
        <Field label="Mobile number" error={state.fieldErrors?.phone} hint="Used for seller verification and account recovery" required>
          <Input name="phone" type="tel" autoComplete="tel" placeholder="+923001234567" required />
        </Field>
        <Field label="Password" error={state.fieldErrors?.password} required>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <><Loader2 className="animate-spin" /> Creating account…</> : "Create account"}
        </Button>
      </form>
    </div>
  );
}
