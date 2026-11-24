"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight, Banknote, CarFront, ChevronRight, Coins, Crown, Gauge,
  Gem, History, LayoutGrid, Leaf, Settings2, Store, Truck, Wallet, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { slugify } from "@/lib/utils";

type Tab = "category" | "budget" | "brand" | "model";

type BrandOption = { name: string; slug: string; logoUrl: string | null };
type ModelOption = {
  name: string;
  makeName: string;
  makeSlug: string;
  slug: string | null;
  count: number | null;
};

type BrowseUsedCarsProps = {
  brands: BrandOption[];
  models: ModelOption[];
};

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "category", label: "Category", icon: LayoutGrid },
  { id: "budget", label: "Budget", icon: Wallet },
  { id: "brand", label: "Brand", icon: Store },
  { id: "model", label: "Model", icon: CarFront },
];

const CATEGORIES: { label: string; meta: string; icon: LucideIcon; href: string }[] = [
  { label: "Sports Cars", meta: "Coupe & performance", icon: Gauge, href: "/search?bodyType=COUPE" },
  { label: "Electric Cars", meta: "Zero-emission drives", icon: Zap, href: "/search?fuelType=ELECTRIC" },
  { label: "Luxury Cars", meta: "Premium picks", icon: Crown, href: "/search?minPrice=5000000" },
  { label: "Japanese Cars", meta: "Reliable favourites", icon: CarFront, href: "/search?make=toyota" },
  { label: "Automatic Cars", meta: "Easy city driving", icon: Settings2, href: "/search?transmission=AUTOMATIC" },
  { label: "Old Cars", meta: "Classics & budget finds", icon: History, href: "/search?yearTo=2010" },
  { label: "Hybrid Cars", meta: "Better mileage", icon: Leaf, href: "/search?fuelType=HYBRID" },
  { label: "Carry Daba", meta: "Pickups & carriers", icon: Truck, href: "/search?q=Carry" },
];

const BUDGETS: { label: string; meta: string; icon: LucideIcon; href: string }[] = [
  { label: "Under 5 Lac", meta: "Great first cars", icon: Wallet, href: "/search?maxPrice=500000" },
  { label: "5 - 10 Lac", meta: "Daily commuters", icon: Banknote, href: "/search?minPrice=500000&maxPrice=1000000" },
  { label: "10 - 15 Lac", meta: "Family favourites", icon: Coins, href: "/search?minPrice=1000000&maxPrice=1500000" },
  { label: "15 - 20 Lac", meta: "Well-equipped rides", icon: Banknote, href: "/search?minPrice=1500000&maxPrice=2000000" },
  { label: "20 - 30 Lac", meta: "Premium choices", icon: Gem, href: "/search?minPrice=2000000&maxPrice=3000000" },
  { label: "30 - 50 Lac", meta: "Nearly new", icon: Gem, href: "/search?minPrice=3000000&maxPrice=5000000" },
  { label: "50 Lac - 1 Crore", meta: "Luxury segment", icon: Crown, href: "/search?minPrice=5000000&maxPrice=10000000" },
  { label: "Above 1 Crore", meta: "Flagship vehicles", icon: Crown, href: "/search?minPrice=10000000" },
];

const BRAND_NAMES = [
  "Toyota", "Honda", "Suzuki", "Hyundai", "Kia", "Nissan",
  "Mitsubishi", "MG", "Changan", "Haval", "BMW", "Mercedes-Benz",
];

const MODEL_NAMES: { name: string; make: string }[] = [
  { name: "Corolla", make: "Toyota" },
  { name: "Yaris", make: "Toyota" },
  { name: "Aqua", make: "Toyota" },
  { name: "Prius", make: "Toyota" },
  { name: "Civic", make: "Honda" },
  { name: "City", make: "Honda" },
  { name: "Alto", make: "Suzuki" },
  { name: "Cultus", make: "Suzuki" },
  { name: "Wagon R", make: "Suzuki" },
  { name: "Sportage", make: "Kia" },
  { name: "Tucson", make: "Hyundai" },
  { name: "Fortuner", make: "Toyota" },
];

function CardLink({
  href, icon, label, meta,
}: { href: string; icon: React.ReactNode; label: string; meta: string }) {
  return (
    <Link
      href={href}
      className="group surface-card flex min-h-32 flex-col rounded-xl p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-link hover:shadow-float sm:min-h-36 sm:p-4"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-signal-50 text-link transition-colors group-hover:bg-link group-hover:text-white dark:bg-link/10 dark:text-link-soft sm:size-11 sm:rounded-xl">
        {icon}
      </span>
      <span className="mt-2 line-clamp-3 text-[0.7rem] font-bold leading-snug text-ink-900 dark:text-white sm:mt-3 sm:line-clamp-2 sm:text-sm">
        {label}
      </span>
      <span className="mt-0.5 hidden text-[0.65rem] text-ink-500 sm:block sm:text-[0.7rem]">{meta}</span>
      <ArrowUpRight className="ml-auto mt-auto hidden size-4 text-ink-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-link sm:block" />
    </Link>
  );
}

export function BrowseUsedCars({ brands, models }: BrowseUsedCarsProps) {
  const [tab, setTab] = useState<Tab>("category");

  const brandOptions: BrandOption[] = BRAND_NAMES.map((name) => {
    const slug = slugify(name);
    const matched = brands.find((brand) => brand.slug === slug);
    return {
      name,
      slug,
      logoUrl: matched?.logoUrl ?? null,
    };
  });

  const modelOptions = MODEL_NAMES.map(({ name, make }) => {
    const matched = models.find((model) =>
      model.name.toLowerCase() === name.toLowerCase() &&
      model.makeName.toLowerCase() === make.toLowerCase(),
    );
    return {
      label: `${make} ${name}`,
      make,
      href: matched
        ? `/search?make=${matched.makeSlug}&model=${matched.slug}`
        : `/search?make=${slugify(make)}&q=${encodeURIComponent(name)}`,
      count: matched?.count ?? null,
    };
  });

  return (
    <section aria-labelledby="browse-used-cars-title" className="surface-card rounded-2xl p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Find your fit</p>
          <h2 id="browse-used-cars-title" className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
            Browse Used Cars
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Find a used car for sale in Pakistan by budget, brand, model and body type.
          </p>
        </div>
        <Link href="/search" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-link transition-colors hover:text-link-ink">
          View all vehicles <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="no-scrollbar mt-6 overflow-x-auto border-b border-ink-100 dark:border-ink-800">
        <div role="tablist" aria-label="Browse used cars" className="flex w-max min-w-full gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`browse-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={tab === id}
              aria-controls="browse-used-cars-panel"
              onClick={() => setTab(id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-t-lg px-4 text-sm font-bold transition-colors ${
                tab === id
                  ? "bg-link-ink text-white"
                  : "text-ink-500 hover:bg-signal-50 hover:text-link dark:text-ink-400 dark:hover:bg-ink-800"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        id="browse-used-cars-panel"
        role="tabpanel"
        aria-labelledby={`browse-tab-${tab}`}
        className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3 lg:grid-cols-6"
      >
        {tab === "category" && CATEGORIES.map((item) => (
          <CardLink
            key={item.label}
            href={item.href}
            icon={<item.icon className="size-4 sm:size-5" />}
            label={item.label}
            meta={item.meta}
          />
        ))}

        {tab === "budget" && BUDGETS.map((item) => (
          <CardLink
            key={item.label}
            href={item.href}
            icon={<item.icon className="size-4 sm:size-5" />}
            label={item.label}
            meta={item.meta}
          />
        ))}

        {tab === "brand" && brandOptions.map((brand) => (
          <Link
            key={brand.name}
            href={`/search?make=${brand.slug}`}
            className="group surface-card flex min-h-32 flex-col items-center justify-center rounded-xl p-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-link hover:shadow-float sm:min-h-36 sm:p-4"
          >
            <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg bg-white p-1.5 ring-1 ring-ink-100 transition-colors group-hover:ring-link dark:bg-ink-800 dark:ring-ink-700 sm:size-14 sm:rounded-xl sm:p-2">
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt={`${brand.name} logo`} className="size-full object-contain" />
              ) : (
                <span className="font-display text-xs font-extrabold text-ink-900 dark:text-white sm:text-base">
                  {brand.name === "Mercedes-Benz" ? "MB" : brand.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </span>
            <span className="mt-2 line-clamp-2 text-[0.7rem] font-bold text-ink-900 dark:text-white sm:mt-3 sm:text-sm">{brand.name}</span>
            <span className="mt-0.5 hidden text-[0.7rem] text-ink-500 sm:block">Browse listings</span>
          </Link>
        ))}

        {tab === "model" && modelOptions.map((model) => (
          <CardLink
            key={model.label}
            href={model.href}
            icon={<CarFront className="size-4 sm:size-5" />}
            label={model.label}
            meta={model.count !== null ? `${model.count} live ads` : `Search ${model.make}`}
          />
        ))}
      </div>
    </section>
  );
}
