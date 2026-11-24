import { prisma } from "@/lib/db";
import { listingInclude, toListingCard } from "@/lib/data/listings";
import type { CategoryLandingData } from "@/components/content/category-landing";

/** Loads a category landing page entirely from live Prisma data. */
export async function getCategoryLanding(slug: string): Promise<CategoryLandingData | null> {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true, isActive: true },
  });
  if (!category || !category.isActive) return null;

  const listingWhere = {
    status: "ACTIVE" as const,
    deletedAt: null,
    vehicle: { categoryId: category.id },
  };

  const [listings, totalListings, makes, cityGroups] = await Promise.all([
    prisma.listing.findMany({
      where: listingWhere,
      include: listingInclude,
      orderBy: { publishedAt: "desc" },
      take: 9,
    }),
    prisma.listing.count({ where: listingWhere }),
    prisma.vehicleMake.findMany({
      where: { isActive: true, vehicles: { some: { categoryId: category.id } } },
      select: { id: true, name: true, slug: true, _count: { select: { models: true } } },
      orderBy: { name: "asc" },
      take: 12,
    }),
    prisma.listing.groupBy({
      by: ["cityId"],
      where: listingWhere,
      _count: { _all: true },
    }),
  ]);

  const cityIds = cityGroups.map((group) => group.cityId).filter((id): id is string => Boolean(id));
  const cityRecords = cityIds.length > 0
    ? await prisma.city.findMany({
        where: { id: { in: cityIds } },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      })
    : [];
  const countByCity = new Map(cityGroups.map((group) => [group.cityId, group._count._all]));

  const makeCounts = await Promise.all(makes.map(async (make) => ({
    name: make.name,
    slug: make.slug,
    modelCount: make._count.models,
    listingCount: await prisma.listing.count({
      where: { ...listingWhere, vehicle: { categoryId: category.id, makeId: make.id } },
    }),
  })));

  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? `Browse ${category.name.toLowerCase()} listings from verified sellers across Pakistan.`,
    totalListings,
    listings: listings.map(toListingCard),
    makes: makeCounts,
    cities: cityRecords.map((city) => ({
      name: city.name,
      slug: city.slug,
      count: countByCity.get(city.id) ?? 0,
    })),
  };
}
