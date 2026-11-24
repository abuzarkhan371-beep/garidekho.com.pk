"use client";

import { useState, useTransition } from "react";
import { Zap } from "lucide-react";
import { setAutoApproveAction } from "@/app/admin/actions";

export function AutoApproveToggle({
  enabled,
  canManage,
}: {
  enabled: boolean;
  canManage: boolean;
}) {
  const [value, setValue] = useState(enabled);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  function toggle(next: boolean) {
    setValue(next);
    setMessage("");
    setFailed(false);
    const formData = new FormData();
    formData.set("enabled", String(next));

    startTransition(async () => {
      const result = await setAutoApproveAction(formData);
      if (result.ok) {
        setMessage(result.message);
        return;
      }
      setValue(!next);
      setFailed(true);
      setMessage(result.message);
    });
  }

  return (
    <div className="surface-card mt-5 flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signal-50 text-link-ink dark:bg-ink-800 dark:text-link-soft">
          <Zap className="size-5" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">Auto-approve new ads</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${
                value
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400"
              }`}
            >
              {value ? "On" : "Off"}
            </span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-ink-500">
            When enabled, newly submitted listings go live immediately instead of waiting in the moderation queue.
          </p>
          {message && (
            <p
              aria-live="polite"
              className={`mt-2 text-xs font-semibold ${failed ? "text-red-600" : "text-link"}`}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-bold text-ink-600 dark:text-ink-300">
          {value ? "Enabled" : "Disabled"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={value}
          aria-label="Auto-approve new ads"
          disabled={!canManage || pending}
          onClick={() => toggle(!value)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            value ? "bg-link" : "bg-ink-300 dark:bg-ink-700"
          }`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full bg-white shadow transition-transform ${
              value ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
