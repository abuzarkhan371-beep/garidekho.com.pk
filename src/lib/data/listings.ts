import { prisma } from "@/lib/db";
import type { Listing, VehicleImage, City, VehicleMake, VehicleModel, Vehicle, Dealer } from "@/generated/prisma/client";
import { parseCarSpecs, type CarSpecs } from "@/lib/data/car-specs";

export type ListingCardData = {
  id: string;
  slug: string;
  title: string;
  price: number;
  negotiable: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  status: string;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  city: string | null;
  citySlug: string | null;
  make: string | null;
  model: string | null;
  year: number;
  mileageKm: number;
  transmission: string | null;
  fuelType: string | null;
  bodyType: string | null;
  image: string;
  imageCount: number;
  specs: CarSpecs | null;
  dealer: string | null;
  dealerSlug: string | null;
};

type ListingWithRelations = Listing & {
  images: VehicleImage[];
  city: City | null;
  dealer: (Dealer & { }) | null;
  vehicle: Vehicle & { make: VehicleMake | null; model: VehicleModel | null };
};

export function toListingCard(listing: ListingWithRelations): ListingCardData {
  const sorted = [...listing.images].sort((a, b) => a.position - b.position);
  return {
    id: listing.id,
    slug: listing.slug,
    title: listing.title,
    price: listing.price,
    negotiable: listing.negotiable,
    isFeatured: listing.isFeatured,
    isVerified: listing.isVerified,
    status: listing.status,
    viewCount: listing.viewCount,
    publishedAt: listing.publishedAt?.toISOString() ?? null,
    createdAt: listing.createdAt.toISOString(),
    city: listing.city?.name ?? null,
    citySlug: listing.city?.slug ?? null,
    make: listing.vehicle.make?.name ?? null,
    model: listing.vehicle.model?.name ?? null,
    year: listing.vehicle.year,
    mileageKm: listing.vehicle.mileageKm,
    transmission: listing.vehicle.transmission,
    fuelType: listing.vehicle.fuelType,
    bodyType: listing.vehicle.bodyType,
    image: sorted[0]?.url ?? "",
    imageCount: sorted.length,
    specs: parseCarSpecs(listing.vehicle.specs),
    dealer: listing.dealer?.businessName ?? null,
    dealerSlug: listing.dealer?.slug ?? null,
  };
}

export const listingInclude = {
  images: { orderBy: { position: "asc" as const } },
  city: true,
  dealer: true,
  vehicle: { include: { category: true, make: true, model: true, variant: true } },
} as const;

export async function getFeaturedListings(limit = 8): Promise<ListingCardData[]> {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE", deletedAt: null, isFeatured: true },
    include: listingInclude,
    orderBy: [{ featuredRank: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
  return listings.map(toListingCard);
}

export async function getLatestListings(limit = 8): Promise<ListingCardData[]> {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    include: listingInclude,
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
  });
  return listings.map(toListingCard);
}

export async function getListingsForCity(citySlug: string, limit = 6): Promise<ListingCardData[]> {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE", deletedAt: null, city: { slug: citySlug } },
    include: listingInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return listings.map(toListingCard);
}

export async function getListingsForMake(makeSlug: string, limit = 6): Promise<ListingCardData[]> {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE", deletedAt: null, vehicle: { make: { slug: makeSlug } } },
    include: listingInclude,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return listings.map(toListingCard);
}

export async function getListingCount() {
  return prisma.listing.count({ where: { status: "ACTIVE", deletedAt: null } });
}
