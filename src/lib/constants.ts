export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "Garidekho";

export const CATEGORIES = [
  { name: "Cars", slug: "cars", href: "/cars", icon: "CarFront" },
  { name: "Bikes", slug: "bikes", href: "/bikes", icon: "Bike" },
  { name: "Commercial", slug: "commercial-vehicles", href: "/commercial-vehicles", icon: "Truck" },
  { name: "Auto Parts", slug: "auto-parts", href: "/auto-parts", icon: "Wrench" },
  { name: "Accessories", slug: "accessories", href: "/accessories", icon: "Sparkles" },
] as const;

export const POPULAR_BRANDS = [
  "Toyota", "Honda", "Suzuki", "Kia", "Hyundai", "MG",
  "Changan", "BYD", "Nissan", "BMW", "Mercedes-Benz",
] as const;

export const BUDGET_RANGES = [
  { label: "Under 5 lac", min: 0, max: 500_000, slug: "under-5-lac" },
  { label: "5 – 10 lac", min: 500_000, max: 1_000_000, slug: "5-10-lac" },
  { label: "10 – 20 lac", min: 1_000_000, max: 2_000_000, slug: "10-20-lac" },
  { label: "20 – 40 lac", min: 2_000_000, max: 4_000_000, slug: "20-40-lac" },
  { label: "40 lac – 1 crore", min: 4_000_000, max: 10_000_000, slug: "40-lac-1-crore" },
  { label: "Above 1 crore", min: 10_000_000, max: null, slug: "above-1-crore" },
] as const;

export const PRICE_PRESETS = [
  { label: "Any price", value: "" },
  { label: "Up to 10 lac", value: "1000000" },
  { label: "Up to 25 lac", value: "2500000" },
  { label: "Up to 50 lac", value: "5000000" },
  { label: "Up to 1 crore", value: "10000000" },
] as const;

export const YEAR_OPTIONS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() + 1 - i);

export const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: "Manual", AUTOMATIC: "Automatic", TIPTRONIC: "Tiptronic", CVT: "CVT",
};

export const FUEL_LABELS: Record<string, string> = {
  PETROL: "Petrol", DIESEL: "Diesel", HYBRID: "Hybrid", ELECTRIC: "Electric", CNG: "CNG", LPG: "LPG",
};

export const BODY_LABELS: Record<string, string> = {
  SEDAN: "Sedan", HATCHBACK: "Hatchback", SUV: "SUV", CROSSOVER: "Crossover", COUPE: "Coupe",
  WAGON: "Wagon", PICKUP: "Pickup", VAN: "Van", TRUCK: "Truck", BUS: "Bus", BIKE: "Bike",
  SCOOTER: "Scooter", THREE_WHEELER: "Three-wheeler", OTHER: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", PENDING: "Pending review", ACTIVE: "Active", REJECTED: "Rejected",
  EXPIRED: "Expired", SOLD: "Sold",
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MODERATOR: "Moderator",
  SUPPORT_AGENT: "Support Agent", DEALER: "Dealer", USER: "Member",
};

export const UPLOAD_MAX_BYTES = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_MB ?? 8) * 1024 * 1024;
export const MAX_LISTING_IMAGES = 20;
