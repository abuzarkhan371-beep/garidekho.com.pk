"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, CalendarDays, ChevronLeft, ChevronRight,
  Fuel, Gauge, GitCompareArrows,
} from "lucide-react";
import { useHorizontalCarousel } from "@/hooks/use-horizontal-carousel";
import { AdminEditLink } from "@/components/admin/admin-edit-link";
import type { CompareCar, ComparisonSet } from "@/lib/data/comparison";
import { formatNumber, formatPrice, titleCase } from "@/lib/utils";

type Mode = "used" | "new";

function MiniCar({ car }: { car: CompareCar }) {
  return (
    <div className="min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink-100 dark:bg-ink-800">
        {car.image ? (
          <Image
            src={car.image}
            alt={car.name}
            fill
            sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 18vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-ink-400">
            <GitCompareArrows className="size-6" />
          </span>
        )}
        {car.kind === "new" ? (
          <span className="absolute right-1 top-1 rounded bg-link px-1.5 py-0.5 text-[0.55rem] font-extrabold text-white">
            NEW
          </span>
        ) : car.isVerified ? (
          <span className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-link text-white">
            <BadgeCheck className="size-3" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 line-clamp-2 min-h-8 text-[0.7rem] font-bold leading-tight text-ink-900 dark:text-white sm:text-xs">
        {car.name}
      </p>
      <p className="mt-1 text-xs font-extrabold text-cta-ink dark:text-cta sm:text-sm">
        {formatPrice(car.price)}
      </p>
      <div className="mt-2 space-y-1 border-t border-ink-100 pt-2 text-[0.65rem] text-ink-500 dark:border-ink-800 sm:text-xs">
        <p className="flex items-center gap-1"><CalendarDays className="size-3 shrink-0" /> {car.year}</p>
        <p className="flex items-center gap-1">
          <Gauge className="size-3 shrink-0" />
          {car.mileageKm === null ? "Brand new" : `${formatNumber(car.mileageKm)} km`}
        </p>
        <p className="flex items-center gap-1 truncate"><Fuel className="size-3 shrink-0" /> {titleCase(car.fuelType ?? "Petrol")}</p>
      </div>
    </div>
  );
}

export function CarComparison({
  sets,
  newSets,
}: {
  sets: ComparisonSet[];
  newSets: ComparisonSet[];
}) {
  const [mode, setMode] = useState<Mode>("used");
  const activeSets = mode === "used" ? sets : newSets;
  const { ref, canPrev, canNext, slide } = useHorizontalCarousel<HTMLDivElement>(mode);

  if (sets.length === 0 && newSets.length === 0) return null;

  return (
    <section aria-labelledby="car-comparison-title" className="surface-card rounded-2xl p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Side by side</p>
          <h2 id="car-comparison-title" className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
            Car Comparison
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Compare used car price in Pakistan or showroom-fresh new cars. Slide through each match-up and open the full spec comparison.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminEditLink href="/admin/cars?type=new" label="Manage comparison cars" />
          <Link
            href="/compare"
            className="group hidden min-h-10 items-center gap-1.5 text-sm font-bold text-link transition-colors hover:text-link-ink dark:text-link-soft sm:inline-flex"
          >
            Compare your own
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <button
            type="button"
            onClick={() => slide(-1)}
            disabled={!canPrev}
            aria-label="Scroll comparison left"
            aria-controls="car-comparison-track"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink-100 text-ink-600 transition-colors hover:border-link hover:bg-signal-50 hover:text-link disabled:cursor-not-allowed disabled:opacity-40 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => slide(1)}
            disabled={!canNext}
            aria-label="Scroll comparison right"
            aria-controls="car-comparison-track"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-white transition-colors hover:bg-link-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="no-scrollbar mt-6 overflow-x-auto border-b border-ink-100 dark:border-ink-800">
        <div role="tablist" aria-label="Car comparison type" className="flex w-max min-w-full gap-1">
          {(["used", "new"] as const).map((value) => (
            <button
              key={value}
              id={`comparison-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={mode === value}
              aria-controls="car-comparison-panel"
              onClick={() => setMode(value)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 px-4 text-sm font-bold transition-colors ${
                mode === value
                  ? "border-b-2 border-link text-link dark:text-link-soft"
                  : "border-b-2 border-transparent text-ink-500 hover:text-link dark:text-ink-400"
              }`}
            >
              {value === "used" ? "Used cars" : "New cars"}
            </button>
          ))}
        </div>
      </div>

      <div
        id="car-comparison-panel"
        role="tabpanel"
        aria-labelledby={`comparison-tab-${mode}`}
      >
        <div
          ref={ref}
          id="car-comparison-track"
          className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth overscroll-x-contain pb-1 sm:gap-4"
        >
          {activeSets.map((set) => (
            <article
              key={set.id}
              data-carousel-card
              className="group flex w-[86%] shrink-0 snap-start flex-col rounded-xl border border-ink-100 bg-canvas p-3 transition-colors hover:border-link sm:w-[58%] sm:p-4 lg:w-[46%] xl:w-[38%] dark:border-ink-800 dark:bg-ink-900/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-signal-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-link dark:bg-link/10 dark:text-link-soft">
                  {set.label}
                </span>
                <span className="flex items-center gap-1 text-[0.65rem] font-semibold text-ink-500">
                  <GitCompareArrows className="size-3" /> {set.title}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-1.5 sm:gap-3">
                <MiniCar car={set.cars[0]} />
                <div className="flex h-full min-h-28 items-center justify-center sm:min-h-36">
                  <span className="flex size-7 items-center justify-center rounded-full bg-navy text-[0.6rem] font-extrabold text-white sm:size-9 sm:text-xs">
                    VS
                  </span>
                </div>
                <MiniCar car={set.cars[1]} />
              </div>

              <Link
                href={set.href}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-navy px-4 text-xs font-bold text-white transition-colors hover:bg-link-ink sm:text-sm"
              >
                Compare specs
                <ArrowRight className="size-4" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
