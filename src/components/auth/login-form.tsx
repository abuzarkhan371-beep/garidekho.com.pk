"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CircleAlert, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { loginAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Label } from "@/components/ui/label";


const initialState: AuthState = {};

export function LoginForm({ next, googleEnabled = false }: { next?: string; googleEnabled?: boolean }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      {state.error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <CircleAlert className="size-4 shrink-0" /> {state.error}
        </p>
      )}
      {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") && (
        <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Password updated. Please sign in with your new password.
        </p>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next ?? "/dashboard"} />
        <Field label="Email address" error={state.fieldErrors?.email} required>
          <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </Field>
        <Field label="Password" error={state.fieldErrors?.password} required>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
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
        <div className="flex items-center justify-between">
          <Link href="/forgot-password" className="text-xs font-semibold text-link hover:underline dark:text-link-soft">Forgot password?</Link>
          <Link href="/verify-phone?purpose=PHONE_LOGIN" className="text-xs font-semibold text-link hover:underline dark:text-link-soft">Login with OTP</Link>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <><Loader2 className="animate-spin" /> Signing in…</> : "Sign in"}
        </Button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
            <span className="h-px flex-1 bg-ink-100 dark:bg-ink-800" /> or <span className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
          </div>
          <Button asChild variant="outline" className="w-full">
            <a href="/api/auth/google">Continue with Google</a>
          </Button>
        </>
      )}
    </div>
  );
}
