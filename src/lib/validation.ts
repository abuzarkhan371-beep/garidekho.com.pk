import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.email("Enter a valid email address").max(160),
  phone: z.string().trim().regex(/^\+92\d{10}$/, "Enter a valid Pakistani mobile number (+92xxxxxxxxxx)"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const otpRequestSchema = z.object({
  phone: z.string().trim().regex(/^\+92\d{10}$/, "Enter a valid Pakistani mobile number"),
});

export const otpVerifySchema = otpRequestSchema.extend({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const forgotPasswordSchema = z.object({ email: z.email("Enter a valid email address") });

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const listingDraftSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Select a category"),
  makeId: z.string().optional(),
  modelId: z.string().optional(),
  variantId: z.string().optional(),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  mileageKm: z.coerce.number().int().min(0).max(2_000_000),
  engineCc: z.coerce.number().int().min(50).max(10000).optional().or(z.literal(0)),
  // Values are validated against the admin-managed taxonomy_options table in the API layer.
  transmission: z.string().trim().max(64),
  fuelType: z.string().trim().max(64),
  bodyType: z.string().trim().max(64),
  exteriorColor: z.string().trim().max(40).optional(),
  assemblyType: z.string().trim().max(64).optional(),
  condition: z.string().trim().max(64).optional(),
  features: z.array(z.string()).max(30).default([]),
  title: z.string().trim().min(10, "Title must be at least 10 characters").max(140),
  description: z.string().trim().min(30, "Description must be at least 30 characters").max(8000),
  price: z.coerce.number().int().min(1000, "Enter a valid price").max(1_000_000_000),
  negotiable: z.boolean().default(false),
  cityId: z.string().min(1, "Select a city"),
  areaId: z.string().optional(),
  registrationCityId: z.string().optional(),
  sellerName: z.string().trim().min(2).max(80),
  sellerPhone: z.string().trim().regex(/^\+92\d{10}$/, "Enter a valid Pakistani mobile number"),
  whatsappNumber: z.string().trim().optional(),
  imageIds: z.array(z.string()).min(1, "Upload at least one photo").max(20, "Maximum 20 photos allowed"),
});

/** Relaxed schema for autosave: incomplete values are allowed while the user types. */
export const listingUpdateSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().optional(),
  makeId: z.string().optional(),
  modelId: z.string().optional(),
  variantId: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  mileageKm: z.coerce.number().int().min(0).max(5_000_000).optional(),
  engineCc: z.coerce.number().int().min(0).max(20000).optional(),
  transmission: z.string().trim().max(64).optional().or(z.literal("")),
  fuelType: z.string().trim().max(64).optional().or(z.literal("")),
  bodyType: z.string().trim().max(64).optional().or(z.literal("")),
  exteriorColor: z.string().max(40).optional(),
  assemblyType: z.string().trim().max(64).optional().or(z.literal("")),
  condition: z.string().trim().max(64).optional().or(z.literal("")),
  features: z.array(z.string()).max(30).optional(),
  title: z.string().max(140).optional(),
  description: z.string().max(8000).optional(),
  price: z.coerce.number().int().min(0).max(2_000_000_000).optional(),
  negotiable: z.boolean().optional(),
  cityId: z.string().optional(),
  areaId: z.string().optional(),
  registrationCityId: z.string().optional(),
  sellerName: z.string().max(80).optional(),
  sellerPhone: z.string().max(30).optional(),
  whatsappNumber: z.string().max(30).optional(),
  showPhone: z.boolean().optional(),
});

export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().trim().regex(/^\+?[\d\s-]{7,20}$/, "Enter a valid phone number"),
  message: z.string().trim().min(5).max(2000),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(3).max(120),
  details: z.string().trim().max(2000).optional(),
});

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid input";
}
