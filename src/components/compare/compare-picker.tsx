"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, GitCompareArrows } from "lucide-react";
import type { CompareCar } from "@/lib/data/comparison";
import { formatPrice, titleCase } from "@/lib/utils";

export function ComparePicker({
  cars,
  mode,
}: {
  cars: CompareCar[];
  mode: "used" | "new";
}) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(slug: string) {
    setSelected((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length < 2) return [...current, slug];
      return [current[1], slug];
    });
  }

  const href = selected.length === 2
    ? `/compare?${mode === "new" ? "type=new&" : ""}a=${encodeURIComponent(selected[0])}&b=${encodeURIComponent(selected[1])}`
    : null;

  return (
    <div>
      <div className="surface-card mb-6 flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-bold">
            <GitCompareArrows className="size-4 text-link" />
            {selected.length} of 2 cars selected
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Pick any two {mode === "new" ? "new cars" : "live listings"}. Your newest pick replaces the older pair.
          </p>
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-link-ink px-5 text-sm font-bold text-white transition-colors hover:bg-link"
          >
            Compare selected <ArrowRight className="size-4" />
          </Link>
        ) : (
          <span className="inline-flex min-h-10 items-center justify-center rounded-lg bg-ink-100 px-5 text-sm font-semibold text-ink-400 dark:bg-ink-800">
            Select two cars
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((car) => {
          const order = selected.indexOf(car.slug);
          const active = order >= 0;
          return (
            <button
              key={car.id}
              type="button"
              onClick={() => toggle(car.slug)}
              aria-pressed={active}
              className={`surface-card group flex gap-3 rounded-xl p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-float ${
                active ? "border-link ring-2 ring-link/20" : ""
              }`}
            >
              <span className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
                {car.image && (
                  <Image src={car.image} alt="" fill sizes="80px" className="object-cover" />
                )}
                {active && (
                  <span className="absolute inset-0 flex items-center justify-center bg-link/85 text-white">
                    <span className="flex size-6 items-center justify-center rounded-full bg-white/25">
                      <Check className="size-4" />
                    </span>
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start gap-1">
                  <span className="line-clamp-2 flex-1 text-sm font-bold leading-snug">{car.name}</span>
                  {(car.kind === "new" || car.isVerified) && <BadgeCheck className="size-4 shrink-0 text-link" />}
                </span>
                <span className="mt-1 block text-xs text-ink-500">
                  {car.year} · {titleCase(car.transmission ?? "Manual")} · {titleCase(car.fuelType ?? "Petrol")}
                </span>
                <span className="mt-1 block text-sm font-extrabold text-cta-ink dark:text-cta">
                  {formatPrice(car.price)}
                </span>
                {active && (
                  <span className="mt-1 block text-[0.65rem] font-bold uppercase tracking-wide text-link">
                    Pick {order + 1}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
