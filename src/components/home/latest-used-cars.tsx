"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import { AdminEditLink } from "@/components/admin/admin-edit-link";
import type { ListingCardData } from "@/lib/data/listings";
import { useHorizontalCarousel } from "@/hooks/use-horizontal-carousel";

export function LatestUsedCars({ listings }: { listings: ListingCardData[] }) {
  const { ref, canPrev, canNext, slide } = useHorizontalCarousel<HTMLDivElement>(listings.length);

  return (
    <section aria-labelledby="latest-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Fresh arrivals</p>
          <h2 id="latest-title" className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
            Latest used cars
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Recently listed used cars for sale in Pakistan from owners and trusted dealers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminEditLink href="/admin/cars?type=used" label="Add / edit used cars" />
          <Link
            href="/search?sort=newest"
            className="group hidden min-h-10 shrink-0 items-center gap-1.5 text-sm font-bold text-link dark:text-link-soft sm:inline-flex"
          >
            See all listings
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <button
            type="button"
            onClick={() => slide(-1)}
            disabled={!canPrev}
            aria-label="Scroll latest cars left"
            aria-controls="latest-used-cars-track"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ink-100 text-ink-600 transition-colors hover:border-link hover:bg-signal-50 hover:text-link disabled:cursor-not-allowed disabled:opacity-40 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => slide(1)}
            disabled={!canNext}
            aria-label="Scroll latest cars right"
            aria-controls="latest-used-cars-track"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-white transition-colors hover:bg-link-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        id="latest-used-cars-track"
        className="no-scrollbar mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth overscroll-x-contain pb-1 sm:gap-4"
      >
        {listings.map((listing) => (
          <div
            key={listing.id}
            data-carousel-card
            className="w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/4)]"
          >
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </section>
  );
}
