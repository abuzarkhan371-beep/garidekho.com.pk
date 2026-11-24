"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHorizontalCarousel } from "@/hooks/use-horizontal-carousel";
import { AdminEditLink } from "@/components/admin/admin-edit-link";
import { NEW_CAR_TABS, type NewCarTab, type NewCarView } from "@/lib/data/new-car-catalog";
import { specValue } from "@/lib/data/car-specs";
import { formatPrice } from "@/lib/utils";

export function FeaturedNewCars({
  cars,
}: {
  cars: Record<NewCarTab, NewCarView[]>;
}) {
  const [tab, setTab] = useState<NewCarTab>("popular");
  const { ref: scrollerRef, canPrev, canNext, slide } = useHorizontalCarousel<HTMLDivElement>(tab);
  const visibleCars = cars[tab] ?? [];
  const activeLabel = NEW_CAR_TABS.find((item) => item.id === tab)?.label ?? "";

  return (
    <section aria-labelledby="featured-new-cars-title" className="surface-card rounded-2xl p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Showroom fresh</p>
          <h2 id="featured-new-cars-title" className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
            Featured New Cars
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Check new car price in Pakistan, specs and photos for the models everyone is talking about.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminEditLink href="/admin/cars?type=new" label="Add / edit new cars" />
          <Link href="/search" className="hidden min-h-10 items-center text-sm font-bold text-link transition-colors hover:text-link-ink sm:inline-flex">
            View all cars
          </Link>
          <button
            type="button"
            onClick={() => slide(-1)}
            disabled={!canPrev}
            aria-label="Scroll cars left"
            aria-controls="featured-new-cars-track"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink-100 text-ink-600 transition-colors hover:border-link hover:bg-signal-50 hover:text-link disabled:cursor-not-allowed disabled:opacity-40 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => slide(1)}
            disabled={!canNext}
            aria-label="Scroll cars right"
            aria-controls="featured-new-cars-track"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-white transition-colors hover:bg-link-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div className="no-scrollbar mt-6 overflow-x-auto border-b border-ink-100 dark:border-ink-800">
        <div role="tablist" aria-label="Featured new cars" className="flex w-max min-w-full gap-1">
          {NEW_CAR_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`new-cars-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls="featured-new-cars-panel"
              onClick={() => setTab(id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-t-lg px-4 text-sm font-bold transition-colors ${
                tab === id
                  ? "bg-link-ink text-white"
                  : "text-ink-500 hover:bg-signal-50 hover:text-link dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        id="featured-new-cars-panel"
        role="tabpanel"
        aria-labelledby={`new-cars-tab-${tab}`}
        className="mt-5"
      >
        <div
          ref={scrollerRef}
          id="featured-new-cars-track"
          className="no-scrollbar flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth overscroll-x-contain pb-1 sm:gap-3"
        >
          {visibleCars.map((car) => (
            <Link
              key={`${tab}-${car.slug}`}
              data-carousel-card
              href={`/search?q=${encodeURIComponent(car.name)}`}
              className="group surface-card relative flex w-[calc((100%-1rem)/3)] shrink-0 snap-start flex-col overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-link hover:shadow-float sm:w-[calc((100%-1.5rem)/3)]"
            >
              <span className="absolute left-2 top-2 z-10 rounded-md bg-navy/90 px-1.5 py-0.5 text-[0.6rem] font-bold text-white sm:text-[0.65rem]">
                {activeLabel}
              </span>
              <span className="relative block aspect-[4/3] overflow-hidden bg-ink-100">
                <Image
                  src={car.image}
                  alt={car.name}
                  fill
                  sizes="33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </span>
              <span className="flex flex-1 flex-col p-2.5 sm:p-3.5">
                <span className="line-clamp-2 text-xs font-bold leading-snug text-ink-900 dark:text-white sm:text-sm">
                  {car.name}
                </span>
                <span className="mt-0.5 truncate text-[0.65rem] text-ink-500 sm:text-xs">
                  {car.year} · {specValue(car.specs, "transmission")} · {specValue(car.specs, "fuelType")}
                </span>
                <span className="mt-auto pt-2 text-xs font-extrabold text-cta-ink dark:text-cta sm:text-base">
                  {formatPrice(car.price)}
                </span>
              </span>
            </Link>
          ))}
          {visibleCars.length === 0 && (
            <p className="w-full py-8 text-center text-sm text-ink-500">
              No {activeLabel.toLowerCase()} cars yet. Add one from the admin panel.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
