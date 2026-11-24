import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2 text-sm text-ink-900 shadow-sm transition-colors placeholder:text-ink-400 hover:border-ink-300 focus-visible:border-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50 dark:placeholder:text-ink-500",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-28 w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-sm transition-colors placeholder:text-ink-400 hover:border-ink-300 focus-visible:border-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
