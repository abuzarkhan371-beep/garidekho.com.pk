import { prisma } from "@/lib/db";
import { parseCarSpecs, specValue } from "@/lib/data/car-specs";
import {
  DEFAULT_NEW_CARS,
  NEW_CAR_TABS,
  defaultCarImage,
  type NewCarTab,
  type NewCarView,
} from "@/lib/data/new-car-catalog";
import type { CompareCar, ComparisonSet } from "@/lib/data/comparison";

export { NEW_CAR_TABS };
export type { NewCarTab, NewCarView };

/** Backwards-compatible alias used by the admin forms. */
export type NewCar = NewCarView;

function isNewCarTab(value: string): value is NewCarTab {
  return NEW_CAR_TABS.some((tab) => tab.id === value);
}

function rowToNewCar(row: {
  id: string;
  slug: string;
  name: string;
  make: string;
  year: number;
  tab: string;
  imageUrl: string | null;
  price: number;
  summary: string | null;
  specs: unknown;
  isActive: boolean;
  sortOrder: number;
}): NewCarView {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    make: row.make,
    year: row.year,
    tab: isNewCarTab(row.tab) ? row.tab : "popular",
    price: row.price,
    image: row.imageUrl || defaultCarImage(row.name),
    summary: row.summary,
    specs: parseCarSpecs(row.specs),
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

/** Live showroom catalogue. Falls back to starter data before the first seed. */
export async function getNewCars(): Promise<NewCarView[]> {
  const rows = await prisma.newCar.findMany({
    where: { isActive: true },
    orderBy: [{ tab: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  if (rows.length === 0) return DEFAULT_NEW_CARS;
  return rows.map(rowToNewCar);
}

export function groupNewCarsByTab(cars: NewCarView[]): Record<NewCarTab, NewCarView[]> {
  const grouped: Record<NewCarTab, NewCarView[]> = { popular: [], upcoming: [], launched: [] };
  for (const car of cars) grouped[car.tab].push(car);
  return grouped;
}

export function newCarToCompareCar(item: NewCarView): CompareCar {
  return {
    id: `new-${item.id ?? item.slug}`,
    slug: item.slug,
    title: item.name,
    name: item.name,
    image: item.image,
    price: item.price,
    year: item.year,
    mileageKm: null,
    transmission: specValue(item.specs, "transmission") === "—" ? null : specValue(item.specs, "transmission"),
    fuelType: specValue(item.specs, "fuelType") === "—" ? null : specValue(item.specs, "fuelType"),
    bodyType: specValue(item.specs, "bodyType") === "—" ? "New car" : specValue(item.specs, "bodyType"),
    city: "Pakistan",
    make: item.make,
    model: item.name.startsWith(`${item.make} `) ? item.name.slice(item.make.length + 1) : item.name,
    isVerified: true,
    kind: "new",
    badge: "New car",
    detailHref: `/search?q=${encodeURIComponent(item.name)}`,
    specs: item.specs,
  };
}

export async function getNewCarBySlugs(slugs: string[]): Promise<CompareCar[]> {
  const unique = Array.from(new Set(slugs.filter(Boolean)));
  if (unique.length === 0) return [];
  const cars = await getNewCars();
  const bySlug = new Map(cars.map((item) => [item.slug, item]));
  return unique
    .map((slug) => bySlug.get(slug))
    .filter((item): item is NewCarView => Boolean(item))
    .map(newCarToCompareCar);
}

export async function getNewCarSuggestions(): Promise<CompareCar[]> {
  const cars = await getNewCars();
  return cars.map(newCarToCompareCar);
}

/** Curated new-car match-ups for the comparison slider. */
export async function getNewCarComparisonSets(limit = 5): Promise<ComparisonSet[]> {
  const grouped = groupNewCarsByTab(await getNewCars());
  const sets: ComparisonSet[] = [];

  for (const tab of NEW_CAR_TABS) {
    const cars = grouped[tab.id];
    for (let index = 0; index + 1 < cars.length && sets.length < limit; index += 2) {
      const first = cars[index];
      const second = cars[index + 1];

      sets.push({
        id: `new-${tab.id}-${first.slug}-${second.slug}`,
        label: tab.label,
        title: `${first.make} vs ${second.make}`,
        href: `/compare?type=new&a=${encodeURIComponent(first.slug)}&b=${encodeURIComponent(second.slug)}`,
        cars: [newCarToCompareCar(first), newCarToCompareCar(second)],
      });
    }
  }

  return sets;
}
