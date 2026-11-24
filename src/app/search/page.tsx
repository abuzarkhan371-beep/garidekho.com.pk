import type { Metadata } from "next";
import Link from "next/link";
import { CarFront, SearchX } from "lucide-react";
import { prisma } from "@/lib/db";
import { listingInclude, toListingCard } from "@/lib/data/listings";
import { buildSearchWhere, buildSort, parseSearchParams, type SearchParams } from "@/lib/search";
import { ListingCard } from "@/components/listings/listing-card";
import { FilterPanel } from "@/components/search/filter-panel";
import { ActiveFilters, Pagination, SortSelect } from "@/components/search/search-controls";
import { MobileFilters } from "@/components/search/mobile-filters";
import { Button } from "@/components/ui/button";
import { getTaxonomyOptions, optionsForGroup, optionsToChoices, optionsToLabelMap } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Search cars & bikes across Pakistan",
  description: "Search a used car for sale in Pakistan or browse verified cars, bikes and commercial vehicles by price, year, mileage, brand and city.",
  keywords: ["used car for sale in Pakistan", "cars for sale in Pakistan", "price in Pakistan"],
  robots: { index: false, follow: true },
};

const PAGE_SIZE = 12;

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const raw = await searchParams;
  const params = parseSearchParams(raw);
  const where = buildSearchWhere(params);

  const [listings, total, makes, cities, categories, taxonomy] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: listingInclude,
      orderBy: buildSort(params.sort),
      skip: (params.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
    prisma.vehicleMake.findMany({ where: { isActive: true }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.city.findMany({ where: { isMajor: true }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ where: { isActive: true }, select: { name: true, slug: true }, orderBy: { sortOrder: "asc" } }),
    getTaxonomyOptions(),
  ]);

  const cards = listings.map(toListingCard);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filterProps = {
    params,
    data: {
      makes,
      cities,
      categories,
      options: {
        bodyTypes: optionsToChoices(optionsForGroup(taxonomy, "BODY_TYPE")),
        fuelTypes: optionsToChoices(optionsForGroup(taxonomy, "FUEL_TYPE")),
        transmissions: optionsToChoices(optionsForGroup(taxonomy, "TRANSMISSION")),
      },
    },
    action: "/search",
  };
  const optionLabels = optionsToLabelMap(taxonomy);
  const heading = params.q ? `Results for “${params.q}”` : params.category ? `${categories.find((c) => c.slug === params.category)?.name ?? "Vehicles"} for sale` : "All vehicles for sale";

  return (
    <div className="container-gdk py-8 lg:py-10">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-ink-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-link">Home</Link><span>/</span><span className="font-semibold text-ink-800">Search</span>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{heading}</h1>
          <p className="mt-1 text-sm text-ink-500">{total} {total === 1 ? "vehicle" : "vehicles"} found across Pakistan</p>
        </div>
        <div className="flex items-center gap-2">
          <MobileFilters><FilterPanel {...filterProps} /></MobileFilters>
          <SortSelect params={params} />
        </div>
      </div>

      <div className="mt-5"><ActiveFilters params={params} optionLabels={optionLabels} /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="surface-card sticky top-24 rounded-xl p-4">
            <FilterPanel {...filterProps} />
          </div>
        </aside>

        <div>
          {cards.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {cards.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className="surface-card flex flex-col items-center rounded-xl px-6 py-20 text-center">
              <SearchX className="size-12 text-ink-300" />
              <h2 className="mt-4 font-display text-xl font-bold">No vehicles matched your search</h2>
              <p className="mt-2 max-w-md text-sm text-ink-500">Try a broader keyword, remove a filter or search a different city. New listings are added every day.</p>
              <Button asChild className="mt-6"><Link href="/search">Clear all filters</Link></Button>
            </div>
          )}

          <Pagination page={params.page} totalPages={totalPages} params={params} />

          {cards.length > 0 && (
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-ink-400">
              <CarFront className="size-4" /> Showing {cards.length} of {total} verified listings
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
