import { prisma } from "@/lib/db";
import type { CarSpecs } from "@/lib/data/car-specs";
import {
  listingInclude,
  toListingCard,
  type ListingCardData,
} from "@/lib/data/listings";

export type CompareCar = {
  id: string;
  slug: string;
  title: string;
  name: string;
  image: string;
  price: number;
  year: number;
  mileageKm: number | null;
  transmission: string | null;
  fuelType: string | null;
  bodyType: string | null;
  city: string | null;
  make: string | null;
  model: string | null;
  isVerified: boolean;
  kind: "used" | "new";
  badge?: string;
  detailHref: string;
  specs: CarSpecs | null;
};

export type ComparisonSet = {
  id: string;
  label: string;
  title: string;
  href: string;
  cars: [CompareCar, CompareCar];
};

export function toCompareCar(card: ListingCardData): CompareCar {
  const name = [card.make, card.model].filter(Boolean).join(" ") || card.title;
  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    name,
    image: card.image,
    price: card.price,
    year: card.year,
    mileageKm: card.mileageKm,
    transmission: card.transmission,
    fuelType: card.fuelType,
    bodyType: card.bodyType,
    city: card.city,
    make: card.make,
    model: card.model,
    isVerified: card.isVerified,
    kind: "used",
    badge: card.isVerified ? "Verified" : undefined,
    detailHref: `/listings/${card.slug}`,
    specs: card.specs,
  };
}

function priceBand(price: number): string {
  if (price < 5_000_000) return "Budget";
  if (price < 10_000_000) return "Mid-range";
  if (price < 20_000_000) return "Premium";
  return "Flagship";
}

/** Pairs nearby-priced live cars into slider-ready comparison cards. */
export async function getComparisonSets(limit = 4): Promise<ComparisonSet[]> {
  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      vehicle: { bodyType: { not: "BIKE" } },
    },
    include: listingInclude,
    orderBy: { publishedAt: "desc" },
    take: 60,
  });

  const cards = listings
    .map(toListingCard)
    .filter((card) => card.image)
    .sort((a, b) => a.price - b.price);

  const sets: ComparisonSet[] = [];
  for (let index = 0; index + 1 < cards.length && sets.length < limit; index += 2) {
    const first = cards[index];
    const second = cards[index + 1];
    const label = priceBand((first.price + second.price) / 2);

    sets.push({
      id: `${first.id}-${second.id}`,
      label,
      title: `${label} head-to-head`,
      href: `/compare?a=${encodeURIComponent(first.slug)}&b=${encodeURIComponent(second.slug)}`,
      cars: [toCompareCar(first), toCompareCar(second)],
    });
  }

  return sets;
}

/** Resolves compare URLs in the order the visitor selected them. */
export async function getCompareListings(slugs: string[]): Promise<ListingCardData[]> {
  const unique = Array.from(new Set(slugs.filter(Boolean)));
  if (unique.length === 0) return [];

  const rows = await prisma.listing.findMany({
    where: { slug: { in: unique }, status: "ACTIVE", deletedAt: null },
    include: listingInclude,
  });
  const bySlug = new Map(rows.map((row) => [row.slug, toListingCard(row)]));
  return unique
    .map((slug) => bySlug.get(slug))
    .filter((card): card is ListingCardData => Boolean(card));
}

export async function getCompareSuggestions(limit = 12): Promise<ListingCardData[]> {
  const rows = await prisma.listing.findMany({
    where: { status: "ACTIVE", deletedAt: null, vehicle: { bodyType: { not: "BIKE" } } },
    include: listingInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return rows.map(toListingCard).filter((card) => card.image);
}
