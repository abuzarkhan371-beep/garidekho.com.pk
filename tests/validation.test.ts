import { describe, expect, it } from "vitest";
import {
  firstError,
  listingDraftSchema,
  otpVerifySchema,
  registerSchema,
} from "@/lib/validation";

const validRegistration = {
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "+923001234567",
  password: "Admin@12345",
};

function registrationIssues(input: unknown) {
  const result = registerSchema.safeParse(input);
  expect(result.success).toBe(false);
  return result.success ? [] : result.error.issues;
}

const validListing = {
  categoryId: "cat-cars",
  year: "2021",
  mileageKm: "42000",
  transmission: "AUTOMATIC",
  fuelType: "PETROL",
  bodyType: "SEDAN",
  title: "Toyota Corolla Altis 1.8 2021",
  description: "Single owner with a complete verified service history from the authorised workshop.",
  price: "5625000",
  cityId: "city-lahore",
  sellerName: "Hassan Raza",
  sellerPhone: "+923001234567",
  imageIds: ["img-1"],
};

function listingIssues(input: unknown) {
  const result = listingDraftSchema.safeParse(input);
  expect(result.success).toBe(false);
  return result.success ? [] : result.error.issues;
}

function paths(issues: { path: PropertyKey[] }[]) {
  return issues.map((issue) => String(issue.path[0]));
}

describe("registerSchema", () => {
  it("accepts a valid registration and trims the name", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      name: "  Ayesha Khan  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        name: "Ayesha Khan",
        email: "ayesha@example.com",
        phone: "+923001234567",
      });
    }
  });

  it("rejects a short name, malformed email, local-format phone and short password", () => {
    const messages = registrationIssues({
      ...validRegistration,
      name: "A",
      email: "not-an-email",
      phone: "03001234567",
      password: "short",
    }).map((issue) => issue.message);

    expect(messages).toEqual(
      expect.arrayContaining([
        "Enter your full name",
        "Enter a valid email address",
        "Enter a valid Pakistani mobile number (+92xxxxxxxxxx)",
        "Password must be at least 8 characters",
      ]),
    );
  });

  it("surfaces the first issue via firstError", () => {
    const result = registerSchema.safeParse({ ...validRegistration, name: "", email: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstError(result.error)).toBe(result.error.issues[0]?.message);
      expect(firstError(result.error)).toBeTruthy();
    }
  });
});

describe("listingDraftSchema", () => {
  it("coerces numeric strings and applies defaults", () => {
    const result = listingDraftSchema.safeParse(validListing);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        year: 2021,
        mileageKm: 42_000,
        price: 5_625_000,
        features: [],
        negotiable: false,
      });
    }
  });

  it("accepts an explicit zero engine capacity and optional identifiers", () => {
    const result = listingDraftSchema.safeParse({ ...validListing, engineCc: 0 });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.engineCc).toBe(0);
  });

  it("rejects thin copy, missing photos and too many photos", () => {
    const shortTitle = listingIssues({ ...validListing, title: "Nice car" });
    expect(shortTitle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["title"],
          message: "Title must be at least 10 characters",
        }),
      ]),
    );

    const shortDescription = listingIssues({ ...validListing, description: "Good condition" });
    expect(shortDescription).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ["description"] }),
      ]),
    );

    expect(listingIssues({ ...validListing, imageIds: [] })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "Upload at least one photo" }),
      ]),
    );

    expect(
      listingIssues({ ...validListing, imageIds: Array.from({ length: 21 }, (_, i) => `img-${i}`) }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "Maximum 20 photos allowed" }),
      ]),
    );
  });

  it("rejects bad seller phones, prices and years", () => {
    const issues = listingIssues({
      ...validListing,
      sellerPhone: "03001234567",
      price: "500",
      year: "1940",
      mileageKm: "-1",
    });

    expect(paths(issues)).toEqual(
      expect.arrayContaining([
        "sellerPhone",
        "price",
        "year",
        "mileageKm",
      ]),
    );
    expect(issues.map((issue) => issue.message)).toContain("Enter a valid Pakistani mobile number");
    expect(issues.map((issue) => issue.message)).toContain("Enter a valid price");
  });

  it("keeps taxonomy fields as strings for admin-managed validation", () => {
    // Transmission, fuel, body type, assembly, condition and features are deliberately
    // not enums here: the draft/publish APIs validate them against active
    // taxonomy_options rows so admins can add new choices without a deployment.
    expect(listingDraftSchema.safeParse({ ...validListing, transmission: "DSG", fuelType: "NITRO" }).success).toBe(true);
  });
});

describe("otpVerifySchema", () => {
  it("requires a six-digit code", () => {
    expect(
      otpVerifySchema.safeParse({ phone: "+923001234567", code: "123456" }).success,
    ).toBe(true);

    const result = otpVerifySchema.safeParse({ phone: "+923001234567", code: "12345" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain("Enter the 6-digit code");
    }
  });
});
