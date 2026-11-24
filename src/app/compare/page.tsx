import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CarFront, MapPin } from "lucide-react";
import { ComparePicker } from "@/components/compare/compare-picker";
import { PageHero } from "@/components/content/page-hero";
import {
  getCompareListings,
  getCompareSuggestions,
  toCompareCar,
  type CompareCar,
} from "@/lib/data/comparison";
import {
  getNewCarBySlugs,
  getNewCarSuggestions,
} from "@/lib/data/new-cars";
import {
  formatDimensions,
  hasSpec,
  specValue,
  type CarSpecs,
} from "@/lib/data/car-specs";
import { formatNumber, formatPrice, titleCase } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compare Cars Side by Side — Pakistan",
  description: "Compare car price in Pakistan, body type, dimensions, ground clearance, transmission, power, fuel economy, EV range and more for any two used or new cars.",
  keywords: ["compare car price in Pakistan", "used car for sale in Pakistan", "new car specifications Pakistan"],
  alternates: { canonical: "/compare" },
};

type SearchParams = Promise<{
  type?: string | string[];
  a?: string | string[];
  b?: string | string[];
}>;

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

type SpecRow = {
  label: string;
  value: (car: CompareCar) => string;
  show?: (a: CompareCar, b: CompareCar) => boolean;
  best?: (a: CompareCar, b: CompareCar) => 0 | 1 | -1;
};

function specText(car: CompareCar, key: keyof CarSpecs, fallback?: string | null) {
  return hasSpec(car.specs, key) ? specValue(car.specs, key) : fallback ?? "—";
}

function numericWinner(a: number | null | undefined, b: number | null | undefined, higherIsBetter: boolean): 0 | 1 | -1 {
  if (a === null || a === undefined || b === null || b === undefined || a === b) return -1;
  if (higherIsBetter) return a > b ? 0 : 1;
  return a < b ? 0 : 1;
}

function specRow(
  label: string,
  key: keyof CarSpecs,
  options: { fallback?: (car: CompareCar) => string | null; best?: (a: CompareCar, b: CompareCar) => 0 | 1 | -1 } = {},
): SpecRow {
  return {
    label,
    value: (car) => specText(car, key, options.fallback?.(car)),
    show: (a, b) => hasSpec(a.specs, key) || hasSpec(b.specs, key) || Boolean(options.fallback?.(a) || options.fallback?.(b)),
    best: options.best,
  };
}

const SPEC_ROWS: SpecRow[] = [
  {
    label: "Price",
    value: (car) => formatPrice(car.price),
    best: (a, b) => (a.price === b.price ? -1 : a.price < b.price ? 0 : 1),
  },
  {
    label: "Model year",
    value: (car) => String(car.year),
    best: (a, b) => (a.year === b.year ? -1 : a.year > b.year ? 0 : 1),
  },
  {
    label: "Mileage",
    value: (car) => `${formatNumber(car.mileageKm ?? 0)} km`,
    show: (a, b) => a.kind === "used" && b.kind === "used",
    best: (a, b) =>
      (a.mileageKm ?? 0) === (b.mileageKm ?? 0) ? -1 : (a.mileageKm ?? 0) < (b.mileageKm ?? 0) ? 0 : 1,
  },
  { label: "Condition", value: (car) => (car.kind === "new" ? "Brand new" : "Pre-owned") },
  specRow("Body Type", "bodyType", { fallback: (car) => car.bodyType }),
  {
    label: "Dimensions (Length x Width x Height)",
    value: (car) => formatDimensions(car.specs),
    show: (a, b) =>
      [a, b].some((car) => [car.specs?.lengthMm, car.specs?.widthMm, car.specs?.heightMm].some((value) => typeof value === "number")),
  },
  specRow("Ground Clearance", "groundClearanceMm", {
    best: (a, b) => numericWinner(a.specs?.groundClearanceMm, b.specs?.groundClearanceMm, true),
  }),
  specRow("Transmission", "transmission", {
    fallback: (car) => (car.transmission ? titleCase(car.transmission) : null),
  }),
  specRow("Horse Power", "horsePower", {
    best: (a, b) => numericWinner(a.specs?.horsePower, b.specs?.horsePower, true),
  }),
  specRow("Boot Space", "bootSpaceL", {
    best: (a, b) => numericWinner(a.specs?.bootSpaceL, b.specs?.bootSpaceL, true),
  }),
  specRow("Kerb Weight", "kerbWeightKg"),
  specRow("Fuel Type", "fuelType", {
    fallback: (car) => (car.fuelType ? titleCase(car.fuelType) : null),
  }),
  specRow("Fuel Average km/ltr", "fuelAverageKmpl", {
    best: (a, b) => numericWinner(a.specs?.fuelAverageKmpl, b.specs?.fuelAverageKmpl, true),
  }),
  specRow("Battery Capacity", "batteryCapacityKwh", {
    best: (a, b) => numericWinner(a.specs?.batteryCapacityKwh, b.specs?.batteryCapacityKwh, true),
  }),
  specRow("Range", "rangeKm", {
    best: (a, b) => numericWinner(a.specs?.rangeKm, b.specs?.rangeKm, true),
  }),
  specRow("Charging Time", "chargingTimeHours", {
    best: (a, b) => numericWinner(a.specs?.chargingTimeHours, b.specs?.chargingTimeHours, false),
  }),
  specRow("Seating Capacity", "seatingCapacity", {
    best: (a, b) => numericWinner(a.specs?.seatingCapacity, b.specs?.seatingCapacity, true),
  }),
  specRow("Top Speed", "topSpeedKmph", {
    best: (a, b) => numericWinner(a.specs?.topSpeedKmph, b.specs?.topSpeedKmph, true),
  }),
  specRow("Tyre Size", "tyreSize"),
  { label: "Location", value: (car) => car.city ?? "Pakistan" },
  {
    label: "Seller",
    value: (car) => (car.kind === "new" ? "Authorised showroom" : car.isVerified ? "Verified seller" : "Private seller"),
  },
];

function CompareCard({ car }: { car: CompareCar }) {
  return (
    <div className="surface-card overflow-hidden rounded-xl">
      <div className="relative aspect-[16/9] bg-ink-100 dark:bg-ink-800">
        {car.image && (
          <Image
            src={car.image}
            alt={car.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-2">
          <h2 className="line-clamp-2 flex-1 font-display text-lg font-bold leading-snug">{car.name}</h2>
          {(car.kind === "new" || car.isVerified) && <BadgeCheck className="size-5 shrink-0 text-link" />}
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="size-3" /> {car.city ?? "Pakistan"}
        </p>
        <p className="mt-3 text-xl font-extrabold text-cta-ink dark:text-cta">
          {formatPrice(car.price)}
        </p>
        <Link
          href={car.detailHref}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-link hover:underline dark:text-link-soft"
        >
          {car.kind === "new" ? "Find this car" : "View listing"} <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const mode: "used" | "new" = first(query.type) === "new" ? "new" : "used";
  const slugs = [first(query.a), first(query.b)].filter((value): value is string => Boolean(value));

  let selected: CompareCar[];
  let suggestions: CompareCar[];

  if (mode === "new") {
    [selected, suggestions] = await Promise.all([
      getNewCarBySlugs(slugs),
      getNewCarSuggestions(),
    ]);
  } else {
    const [listings, available] = await Promise.all([
      getCompareListings(slugs),
      getCompareSuggestions(12),
    ]);
    selected = listings.map(toCompareCar);
    suggestions = available.map(toCompareCar);
  }

  const switchHref = mode === "new" ? "/compare" : "/compare?type=new";

  return (
    <>
      <PageHero
        eyebrow="Buyer tools"
        title={mode === "new" ? "Compare new cars side by side" : "Compare cars side by side"}
        description={
          mode === "new"
            ? "Line up showroom-fresh cars by expected price, year, transmission and fuel type before you visit a dealer."
            : "Put two live listings next to each other and check the numbers that matter: price, year, mileage, transmission and fuel type."
        }
        breadcrumb={[{ label: "Compare cars", href: "/compare" }]}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-600 dark:text-ink-300">
            <CarFront className="size-4 text-link" /> {suggestions.length} {mode === "new" ? "new cars" : "cars"} available to compare
          </p>
          <Link href={switchHref} className="text-sm font-bold text-link hover:underline dark:text-link-soft">
            Compare {mode === "new" ? "used cars" : "new cars"} <ArrowRight className="inline size-4" />
          </Link>
        </div>
      </PageHero>

      <div className="container-gdk space-y-12 py-10 lg:py-14">
        {selected.length === 2 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {selected.map((car) => <CompareCard key={car.id} car={car} />)}
            </div>

            <section aria-labelledby="compare-specs-title">
              <h2 id="compare-specs-title" className="font-display text-2xl font-extrabold">
                Specification comparison
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Highlighted cells are the stronger value for that row.
              </p>
              <div className="surface-card mt-5 overflow-x-auto rounded-xl">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 dark:border-ink-800">
                      <th className="w-40 px-5 py-4 text-xs font-bold uppercase tracking-wide text-ink-500">Specification</th>
                      <th className="px-5 py-4 font-bold">{selected[0].name}</th>
                      <th className="px-5 py-4 font-bold">{selected[1].name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SPEC_ROWS.filter((row) => !row.show || row.show(selected[0], selected[1])).map((row) => {
                      const winner = row.best?.(selected[0], selected[1]) ?? -1;
                      return (
                        <tr key={row.label} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
                          <th scope="row" className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-ink-500">
                            {row.label}
                          </th>
                          <td className={`px-5 py-4 font-semibold ${winner === 0 ? "bg-signal-50 text-link-ink dark:bg-link/10 dark:text-link-soft" : ""}`}>
                            {row.value(selected[0])}
                          </td>
                          <td className={`px-5 py-4 font-semibold ${winner === 1 ? "bg-signal-50 text-link-ink dark:bg-link/10 dark:text-link-soft" : ""}`}>
                            {row.value(selected[1])}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <div className="surface-card rounded-xl p-6 text-center">
            <CarFront className="mx-auto size-8 text-link" />
            <h2 className="mt-3 font-display text-xl font-bold">Choose two cars to begin</h2>
            <p className="mt-1 text-sm text-ink-500">
              {selected.length === 1
                ? "One car is ready. Add a second one from the list below."
                : `Select any two ${mode === "new" ? "new cars" : "listings"} below and we will build the comparison for you.`}
            </p>
          </div>
        )}

        <section aria-labelledby="compare-picker-title">
          <h2 id="compare-picker-title" className="font-display text-2xl font-extrabold">
            {selected.length === 2 ? "Try another comparison" : "Available cars"}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {mode === "new"
              ? "Popular, upcoming and newly launched cars from our showroom guide."
              : "Live listings from owners and verified dealers across Pakistan."}
          </p>
          <div className="mt-6">
            <ComparePicker cars={suggestions} mode={mode} />
          </div>
        </section>
      </div>
    </>
  );
}
