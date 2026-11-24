import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clamp,
  cn,
  formatDate,
  formatNumber,
  formatPrice,
  slugify,
  timeAgo,
  titleCase,
} from "@/lib/utils";

describe("cn", () => {
  it("merges conflicting Tailwind utilities, keeping the last value", () => {
    expect(cn("px-2", "px-4", "text-sm")).toBe("px-4 text-sm");
  });

  it("ignores conditional falsy values and flattens nested inputs", () => {
    expect(cn("block", false && "hidden", undefined, null, "", ["text-lg", { hidden: false }])).toBe(
      "block text-lg",
    );
  });
});

describe("formatPrice", () => {
  it("uses Pakistani Lacs/Crore units instead of million/k/cr", () => {
    expect(formatPrice(0)).toBe("PKR 0");
    expect(formatPrice(999)).toBe("PKR 999");
    expect(formatPrice(1_000)).toBe("PKR 1,000");
    expect(formatPrice(99_999)).toBe("PKR 99,999");
    expect(formatPrice(100_000)).toBe("PKR 1 Lac");
    expect(formatPrice(999_999)).toBe("PKR 9.99 Lacs");
    expect(formatPrice(1_200_000)).toBe("PKR 12 Lacs");
    expect(formatPrice(2_500_000)).toBe("PKR 25 Lacs");
    expect(formatPrice(10_000_000)).toBe("PKR 1 Crore");
    expect(formatPrice(31_500_000)).toBe("PKR 3.15 Crore");
  });
});

describe("formatNumber / formatDate", () => {
  it("groups numbers using the en-PK locale", () => {
    expect(formatNumber(1_234_567)).toBe("1,234,567");
  });

  it("formats a UTC-safe timestamp as a short Pakistani date", () => {
    expect(formatDate("2024-03-05T12:00:00Z")).toBe("5 Mar 2024");
    expect(formatDate(new Date("2024-12-31T12:00:00Z"))).toBe("31 Dec 2024");
  });
});

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-03-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("describes recent activity in progressively larger units", () => {
    expect(timeAgo("2024-03-05T11:59:40Z")).toBe("just now");
    expect(timeAgo("2024-03-05T11:55:00Z")).toBe("5m ago");
    expect(timeAgo("2024-03-05T10:30:00Z")).toBe("1h ago");
    expect(timeAgo("2024-03-03T12:00:00Z")).toBe("2d ago");
  });

  it("falls back to an absolute date after 30 days", () => {
    expect(timeAgo("2024-01-25T12:00:00Z")).toBe("25 Jan 2024");
  });
});

describe("slugify / titleCase / clamp", () => {
  it("slugifies user-supplied titles", () => {
    expect(slugify("  Toyota Corolla 2021!! ")).toBe("toyota-corolla-2021");
    expect(slugify("Already_Slug/Here")).toBe("already-slug-here");
    expect(slugify("!!!")).toBe("");
  });

  it("turns enum-style keys into labels", () => {
    expect(titleCase("SUPER_ADMIN")).toBe("Super Admin");
    expect(titleCase("featured")).toBe("Featured");
  });

  it("bounds values to the inclusive range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(7, 7, 7)).toBe(7);
  });
});
