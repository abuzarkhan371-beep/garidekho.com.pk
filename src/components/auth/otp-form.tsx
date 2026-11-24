"use client";

import { useActionState, useEffect, useState } from "react";
import { CircleAlert, Loader2, Smartphone } from "lucide-react";
import { requestOtpAction, verifyOtpAction, type AuthState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";

const initialState: AuthState = {};

export function OtpForm({ purpose, onVerified }: { purpose: string; onVerified?: () => void }) {
  const [phone, setPhone] = useState("");
  const [requestState, requestAction, requesting] = useActionState(requestOtpAction, initialState);
  const [verifyState, verifyAction, verifying] = useActionState(verifyOtpAction, initialState);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (verifyState.success) onVerified?.();
  }, [verifyState.success, onVerified]);

  useEffect(() => {
    if (requestState.message && phone) setPhone(phone);
  }, [requestState.message, phone]);

  return (
    <div className="space-y-5">
      {(requestState.error || verifyState.error) && (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <CircleAlert className="size-4 shrink-0" /> {requestState.error ?? verifyState.error}
        </p>
      )}

      <form action={requestAction} className="space-y-3">
        <input type="hidden" name="purpose" value={purpose} />
        <Field label="Mobile number" error={requestState.fieldErrors?.phone} required>
          <Input name="phone" type="tel" placeholder="+923001234567" value={phone} onChange={(event) => setPhone(event.target.value)} required />
        </Field>
        <Button type="submit" variant="outline" className="w-full" disabled={requesting}>
          {requesting ? <><Loader2 className="animate-spin" /> Sending…</> : <><Smartphone /> Send verification code</>}
        </Button>
      </form>

      {requestState.message && (
        <div className="space-y-3 rounded-xl border border-signal-200 bg-signal-50 p-4 dark:border-link/40 dark:bg-link/10">
          <p className="text-sm font-medium text-link-ink dark:text-link-soft">{requestState.message}</p>
          {requestState.code && (
            <p className="text-xs text-link dark:text-link-soft">
              Development code: <span className="font-mono text-sm font-bold">{requestState.code}</span>
            </p>
          )}
          <form action={verifyAction} className="space-y-3">
            <input type="hidden" name="purpose" value={purpose} />
            <input type="hidden" name="phone" value={phone} />
            <Field label="6-digit code" error={verifyState.fieldErrors?.code} required>
              <Input
                name="code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="text-center font-mono text-lg tracking-[0.4em]"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                required
              />
            </Field>
            <Button type="submit" className="w-full" disabled={verifying || code.length !== 6}>
              {verifying ? <><Loader2 className="animate-spin" /> Verifying…</> : "Verify & continue"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
