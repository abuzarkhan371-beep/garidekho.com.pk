import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a PKR amount using familiar Pakistani units (Lacs/Crore). */
export function formatPrice(value: number): string {
  const amount = Number.isFinite(value) ? Math.max(0, value) : 0;
  const grouped = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount);

  const localUnit = (divisor: number, singular: string, plural: string) => {
    const truncated = Math.floor((amount / divisor) * 100) / 100;
    const formatted = new Intl.NumberFormat("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(truncated);
    return `PKR ${formatted} ${formatted === "1" ? singular : plural}`;
  };

  if (amount >= 10_000_000) return localUnit(10_000_000, "Crore", "Crore");
  if (amount >= 100_000) return localUnit(100_000, "Lac", "Lacs");
  return `PKR ${grouped}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-PK").format(value);
}

export function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function timeAgo(value: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
