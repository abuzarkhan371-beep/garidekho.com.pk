"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-sm font-medium leading-none text-ink-800 dark:text-ink-100", className)}
    {...props}
  />
));
Label.displayName = "Label";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const generatedId = React.useId();
  const childProps = React.isValidElement(children)
    ? (children.props as { id?: string })
    : {};
  const controlId = childProps.id ?? generatedId;
  const hintId = `${generatedId}-hint`;
  const errorId = `${generatedId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ id?: string; "aria-describedby"?: string }>, {
        id: controlId,
        "aria-describedby": describedBy,
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={controlId}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {control}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
