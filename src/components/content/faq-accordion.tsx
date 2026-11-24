"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqCategory = {
  title: string;
  description: string;
  questions: { question: string; answer: string }[];
};

/** Accessible, keyboard-friendly FAQ accordion built on the installed Radix primitive. */
export function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {categories.map((category) => (
        <section key={category.title} className="surface-card rounded-xl p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">{category.title}</h2>
          <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{category.description}</p>
          <Accordion.Root type="single" collapsible className="mt-4 space-y-2">
            {category.questions.map((item, index) => (
              <Accordion.Item
                key={item.question}
                value={`${category.title}-${index}`}
                className="overflow-hidden rounded-xl border border-ink-100 dark:border-ink-800"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-800">
                    {item.question}
                    <ChevronDown className="size-4 shrink-0 text-ink-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content
                  className={cn(
                    "px-4 pb-4 pt-0 text-sm leading-relaxed text-ink-600",
                    "data-[state=closed]:animate-none",
                    "dark:text-ink-300",
                  )}
                >
                  {item.answer}
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </section>
      ))}
    </div>
  );
}
