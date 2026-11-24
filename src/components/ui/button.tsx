"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-orange-500 text-white shadow-sm hover:bg-orange-600 hover:shadow-md active:scale-[0.98]",
        brand: "bg-orange-500 text-white shadow-sm hover:bg-orange-600 active:scale-[0.98] dark:bg-orange-500 dark:text-white dark:hover:bg-orange-600",
        outline: "border border-ink-100 bg-white text-ink-900 hover:border-link hover:text-link dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:hover:border-link",
        secondary: "bg-ink-100 text-ink-900 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-50 dark:hover:bg-ink-700",
        ghost: "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800",
        signal: "bg-orange-500 text-white hover:bg-orange-600 shadow-sm active:scale-[0.98]",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        link: "text-link underline-offset-4 hover:text-link-ink hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
