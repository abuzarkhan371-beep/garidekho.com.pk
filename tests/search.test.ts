import { describe, expect, it } from "vitest";
import {
  buildSearchWhere,
  buildSort,
  parseSearchParams,
  toQueryString,
} from "@/lib/search";

describe("parseSearchParams", () => {
  it("normalises strings, repeated params and page numbers", () => {
    const parsed = parseSearchParams({
      q: "corolla",
      city: ["karachi", "lahore"],
      page: "3.9",
    });

    expect(parsed.q).toBe("corolla");
    expect(parsed.city).toBe("karachi");
    expect(parsed.page).toBe(3);
    expect(parsed.make).toBe("");
    expect(parsed.sort).toBe("");
  });

  it("falls back to page 1 for missing, non-numeric, zero and negative pages", () => {
    expect(parseSearchParams({}).page).toBe(1);
    expect(parseSearchParams({ page: "abc" }).page).toBe(1);
    expect(parseSearchParams({ page: "0" }).page).toBe(1);
    expect(parseSearchParams({ page: "-4" }).page).toBe(1);
    expect(parseSearchParams({ page: "[]" }).page).toBe(1);
    // The page is read from the raw (possibly repeated) value, not the first
    // normalised string, so repeated page params fall back to 1.
    expect(parseSearchParams({ page: ["2", "9"] }).page).toBe(1);
  });

  it("treats an empty repeated param as empty and ignores unknown keys", () => {
    const parsed = parseSearchParams({ city: [], unexpected: "ignored" });

    expect(parsed.city).toBe("");
    expect(parsed).not.toHaveProperty("unexpected");
  });
});

describe("buildSearchWhere", () => {
  it("always restricts results to active, non-deleted listings", () => {
    expect(buildSearchWhere(parseSearchParams({}))).toEqual({
      status: "ACTIVE",
      deletedAt: null,
    });
  });

  it("builds a case-insensitive OR across title, taxonomy, location and dealer", () => {
    const where = buildSearchWhere(parseSearchParams({ q: "  Corolla  " }));

    expect(where.OR).toHaveLength(8);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { title: { contains: "Corolla", mode: "insensitive" } },
        { vehicle: { model: { name: { contains: "Corolla", mode: "insensitive" } } } },
        { dealer: { businessName: { contains: "Corolla", mode: "insensitive" } } },
      ]),
    );
  });

  it("adds an exact year condition for four-digit searches", () => {
    const where = buildSearchWhere(parseSearchParams({ q: "2021" }));

    expect(where.OR).toHaveLength(9);
    expect(where.OR).toContainEqual({ vehicle: { year: 2021 } });
  });

  it("maps every supported filter into the correct Prisma relation", () => {
    const where = buildSearchWhere(
      parseSearchParams({
        category: "cars",
        make: "toyota",
        model: "corolla",
        yearFrom: "2018",
        yearTo: "2023",
        minMileage: "1000",
        maxMileage: "90000",
        engineCc: "1800",
        transmission: "AUTOMATIC",
        fuelType: "PETROL",
        bodyType: "SEDAN",
        color: "White",
        minPrice: "1000000",
        maxPrice: "5000000",
        city: "lahore",
        registrationCity: "karachi",
        sellerType: "DEALER",
        verified: "true",
        featured: "true",
      }),
    );

    expect(where).toMatchObject({
      status: "ACTIVE",
      deletedAt: null,
      vehicle: {
        category: { slug: "cars" },
        make: { slug: "toyota" },
        model: { slug: "corolla" },
        year: { gte: 2018, lte: 2023 },
        mileageKm: { gte: 1000, lte: 90000 },
        engineCc: { gte: 1800 },
        transmission: "AUTOMATIC",
        fuelType: "PETROL",
        bodyType: "SEDAN",
        exteriorColor: { contains: "White", mode: "insensitive" },
      },
      price: { gte: 1_000_000, lte: 5_000_000 },
      city: { slug: "lahore" },
      registrationCity: { slug: "karachi" },
      sellerType: "DEALER",
      isVerified: true,
      isFeatured: true,
    });
  });

  it("supports one-sided ranges", () => {
    expect(buildSearchWhere(parseSearchParams({ minPrice: "250000" })).price).toEqual({
      gte: 250_000,
    });
    expect(buildSearchWhere(parseSearchParams({ yearTo: "2020" })).vehicle).toEqual({
      year: { lte: 2020 },
    });
  });

  it("does not apply boolean filters unless the value is exactly 'true'", () => {
    const where = buildSearchWhere(
      parseSearchParams({ q: "   ", verified: "false", featured: "TRUE" }),
    );

    expect(where).toEqual({ status: "ACTIVE", deletedAt: null });
    expect(where).not.toHaveProperty("OR");
    expect(where).not.toHaveProperty("isVerified");
    expect(where).not.toHaveProperty("isFeatured");
  });
});

describe("buildSort", () => {
  it("uses recency as a deterministic tie-breaker for every sort", () => {
    expect(buildSort("price-asc")).toEqual([{ price: "asc" }, { publishedAt: "desc" }]);
    expect(buildSort("price-desc")).toEqual([{ price: "desc" }, { publishedAt: "desc" }]);
    expect(buildSort("year-desc")).toEqual([
      { vehicle: { year: "desc" } },
      { publishedAt: "desc" },
    ]);
    expect(buildSort("popular")).toEqual([{ viewCount: "desc" }, { publishedAt: "desc" }]);
    expect(buildSort("mileage-asc")).toEqual([
      { vehicle: { mileageKm: "asc" } },
      { publishedAt: "desc" },
    ]);
  });

  it("falls back to featured-first ordering for unknown or empty values", () => {
    const expected = [{ isFeatured: "desc" }, { publishedAt: "desc" }];

    expect(buildSort("")).toEqual(expected);
    expect(buildSort("newest")).toEqual(expected);
    expect(buildSort("'; DROP TABLE listings;--")).toEqual(expected);
  });
});

describe("toQueryString", () => {
  it("serialises only populated params and round-trips through the parser", () => {
    const params = parseSearchParams({
      q: "Toyota Corolla",
      city: "lahore",
      minPrice: "1000000",
      page: "2",
    });
    const query = toQueryString(params);
    const search = new URLSearchParams(query);

    expect(search.get("q")).toBe("Toyota Corolla");
    expect(search.get("city")).toBe("lahore");
    expect(search.get("page")).toBe("2");
    expect(search.has("make")).toBe(false);
    expect(search.has("featured")).toBe(false);
    expect(parseSearchParams(Object.fromEntries(search)).q).toBe("Toyota Corolla");
  });

  it("returns an empty string when no filters are active", () => {
    expect(toQueryString(parseSearchParams({}))).toBe("");
  });
});
