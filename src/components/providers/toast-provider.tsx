"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };

const ToastContext = createContext<{ toast: (message: string, kind?: ToastKind) => void }>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((item) => {
          const Icon = item.kind === "success" ? CheckCircle2 : item.kind === "error" ? CircleAlert : Info;
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-float dark:bg-ink-900",
                item.kind === "error" ? "border-red-200 dark:border-red-900" : "border-signal-200 dark:border-link/40",
              )}
              role="status"
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", item.kind === "error" ? "text-red-600" : "text-link")} />
              <p className="flex-1 text-sm font-medium">{item.message}</p>
              <button
                onClick={() => setToasts((current) => current.filter((t) => t.id !== item.id))}
                className="text-ink-400 hover:text-ink-700"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
