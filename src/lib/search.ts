import { Prisma } from "@/generated/prisma/client";

export type SearchParams = Record<string, string | string[] | undefined>;

export type ParsedSearch = {
  q: string;
  category: string;
  make: string;
  model: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  yearFrom: string;
  yearTo: string;
  minMileage: string;
  maxMileage: string;
  engineCc: string;
  transmission: string;
  fuelType: string;
  bodyType: string;
  color: string;
  registrationCity: string;
  sellerType: string;
  verified: string;
  featured: string;
  sort: string;
  page: number;
};

const keys: (keyof ParsedSearch)[] = [
  "q", "category", "make", "model", "city", "minPrice", "maxPrice", "yearFrom", "yearTo",
  "minMileage", "maxMileage", "engineCc", "transmission", "fuelType", "bodyType", "color",
  "registrationCity", "sellerType", "verified", "featured", "sort", "page",
];

export function parseSearchParams(input: SearchParams): ParsedSearch {
  const result = {} as ParsedSearch;
  const strings = result as unknown as Record<string, string>;
  for (const key of keys) {
    const value = input[key];
    strings[key] = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  }
  const page = Number(input.page);
  result.page = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  return result;
}

/** Builds a server-side Prisma filter from human-friendly, SEO-safe query params. */
export function buildSearchWhere(params: ParsedSearch): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: "ACTIVE", deletedAt: null };
  const vehicle: Prisma.VehicleWhereInput = {};

  if (params.q.trim()) {
    const term = params.q.trim();
    const conditions: Prisma.ListingWhereInput[] = [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { vehicle: { make: { name: { contains: term, mode: "insensitive" } } } },
      { vehicle: { model: { name: { contains: term, mode: "insensitive" } } } },
      { vehicle: { variant: { name: { contains: term, mode: "insensitive" } } } },
      { city: { name: { contains: term, mode: "insensitive" } } },
      { area: { name: { contains: term, mode: "insensitive" } } },
      { dealer: { businessName: { contains: term, mode: "insensitive" } } },
    ];
    if (/^\d{4}$/.test(term)) conditions.push({ vehicle: { year: Number(term) } });
    where.OR = conditions;
  }

  if (params.category) vehicle.category = { slug: params.category };
  if (params.make) vehicle.make = { slug: params.make };
  if (params.model) vehicle.model = { slug: params.model };

  if (params.yearFrom || params.yearTo) {
    vehicle.year = {
      ...(params.yearFrom ? { gte: Number(params.yearFrom) } : {}),
      ...(params.yearTo ? { lte: Number(params.yearTo) } : {}),
    };
  }
  if (params.minMileage || params.maxMileage) {
    vehicle.mileageKm = {
      ...(params.minMileage ? { gte: Number(params.minMileage) } : {}),
      ...(params.maxMileage ? { lte: Number(params.maxMileage) } : {}),
    };
  }
  if (params.engineCc) vehicle.engineCc = { gte: Number(params.engineCc) };
  if (params.transmission) vehicle.transmission = params.transmission;
  if (params.fuelType) vehicle.fuelType = params.fuelType;
  if (params.bodyType) vehicle.bodyType = params.bodyType;
  if (params.color) vehicle.exteriorColor = { contains: params.color, mode: "insensitive" };

  if (Object.keys(vehicle).length > 0) where.vehicle = vehicle;

  if (params.minPrice || params.maxPrice) {
    where.price = {
      ...(params.minPrice ? { gte: Number(params.minPrice) } : {}),
      ...(params.maxPrice ? { lte: Number(params.maxPrice) } : {}),
    };
  }
  if (params.city) where.city = { slug: params.city };
  if (params.registrationCity) where.registrationCity = { slug: params.registrationCity };
  if (params.sellerType) where.sellerType = params.sellerType as never;
  if (params.verified === "true") where.isVerified = true;
  if (params.featured === "true") where.isFeatured = true;

  return where;
}

export function buildSort(sort: string): Prisma.ListingOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc": return [{ price: "asc" }, { publishedAt: "desc" }];
    case "price-desc": return [{ price: "desc" }, { publishedAt: "desc" }];
    case "year-desc": return [{ vehicle: { year: "desc" } }, { publishedAt: "desc" }];
    case "popular": return [{ viewCount: "desc" }, { publishedAt: "desc" }];
    case "mileage-asc": return [{ vehicle: { mileageKm: "asc" } }, { publishedAt: "desc" }];
    default: return [{ isFeatured: "desc" }, { publishedAt: "desc" }];
  }
}

export function toQueryString(params: ParsedSearch) {
  const search = new URLSearchParams();
  for (const key of keys) {
    const value = params[key as keyof ParsedSearch] as string | number;
    // Page 1 is the default and should not appear in shareable URLs.
    if (value && !(key === "page" && Number(value) === 1)) search.set(key, String(value));
  }
  return search.toString();
}
