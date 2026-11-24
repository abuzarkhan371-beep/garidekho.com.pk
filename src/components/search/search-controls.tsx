"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toQueryString, type ParsedSearch } from "@/lib/search";
import { cn } from "@/lib/utils";

const labels: Record<string, string> = {
  q: "Search", category: "Category", make: "Brand", city: "City", minPrice: "Min price",
  maxPrice: "Max price", yearFrom: "Year from", yearTo: "Year to", minMileage: "Min mileage",
  maxMileage: "Max mileage", engineCc: "Engine", transmission: "Transmission", fuelType: "Fuel",
  bodyType: "Body", color: "Colour", registrationCity: "Registration", sellerType: "Seller",
  verified: "Verified", featured: "Featured",
};

function displayValue(key: string, value: string, optionLabels: Record<string, string>) {
  if (key === "transmission" || key === "fuelType" || key === "bodyType") return optionLabels[value] ?? value;
  if (key === "verified" || key === "featured") return "Yes";
  if (key === "sellerType") return value === "DEALER" ? "Dealer" : "Private owner";
  if (key === "minPrice" || key === "maxPrice") return `PKR ${Number(value).toLocaleString("en-PK")}`;
  return value;
}

export function ActiveFilters({
  params, optionLabels = {},
}: { params: ParsedSearch; optionLabels?: Record<string, string> }) {
  const chips = Object.entries(labels)
    .filter(([key]) => {
      const value = params[key as keyof ParsedSearch];
      return typeof value === "string" && value.length > 0;
    })
    .map(([key, label]) => {
      const next = { ...params, [key]: "" } as ParsedSearch;
      return { key, label, value: displayValue(key, params[key as keyof ParsedSearch] as string, optionLabels), href: `/search?${toQueryString(next)}` };
    });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-ink-500">Active filters:</span>
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          className="inline-flex items-center gap-1.5 rounded-full border border-signal-200 bg-signal-50 px-2.5 py-1 text-xs font-semibold text-link-ink transition-colors hover:bg-signal-100 dark:border-link/40 dark:bg-link/10 dark:text-link-soft"
        >
          {chip.label}: {chip.value} <X className="size-3" />
        </Link>
      ))}
      <Link href="/search" className="text-xs font-bold text-ink-500 underline underline-offset-2 transition-colors hover:text-link">Clear all</Link>
    </div>
  );
}

export function SortSelect({ params }: { params: ParsedSearch }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs font-semibold text-ink-500 sm:inline">Sort by</span>
      <Select
        value={params.sort || "newest"}
        onValueChange={(value) => {
          const next = { ...params, sort: value, page: 1 } as ParsedSearch;
          router.push(`/search?${toQueryString(next)}`);
        }}
      >
        <SelectTrigger className="h-10 w-44 text-xs" aria-label="Sort listings"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Recently added</SelectItem>
          <SelectItem value="price-asc">Price: low to high</SelectItem>
          <SelectItem value="price-desc">Price: high to low</SelectItem>
          <SelectItem value="year-desc">Model year</SelectItem>
          <SelectItem value="popular">Most popular</SelectItem>
          <SelectItem value="mileage-asc">Lowest mileage</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function Pagination({
  page, totalPages, params,
}: { page: number; totalPages: number; params: ParsedSearch }) {
  if (totalPages <= 1) return null;
  const href = (target: number) => `/search?${toQueryString({ ...params, page: target } as ParsedSearch)}`;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, index) => index + 1).filter(
    (item) => item === 1 || item === totalPages || Math.abs(item - page) <= 2,
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Link href={href(Math.max(1, page - 1))} className={cn("flex size-9 items-center justify-center rounded-lg border border-ink-200 dark:border-ink-700", page === 1 && "pointer-events-none opacity-40")} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </Link>
      {pages.map((item) => (
        <Link
          key={item}
          href={href(item)}
          className={cn(
            "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold",
            item === page
              ? "border-link-ink bg-link-ink text-white"
              : "border-ink-200 text-ink-600 hover:border-link dark:border-ink-700 dark:text-ink-200",
          )}
        >
          {item}
        </Link>
      ))}
      <Link href={href(Math.min(totalPages, page + 1))} className={cn("flex size-9 items-center justify-center rounded-lg border border-ink-200 dark:border-ink-700", page === totalPages && "pointer-events-none opacity-40")} aria-label="Next page">
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
