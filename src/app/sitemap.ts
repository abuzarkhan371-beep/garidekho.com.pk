import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { prisma } from "@/lib/db";

// Keep new listings and published articles in the sitemap without waiting for a rebuild.
export const dynamic = "force-dynamic";

const PUBLIC_PAGES = [
  { path: "/", frequency: "daily", priority: 1 },
  { path: "/cars", frequency: "daily", priority: 0.9 },
  { path: "/bikes", frequency: "daily", priority: 0.8 },
  { path: "/commercial-vehicles", frequency: "daily", priority: 0.7 },
  { path: "/auto-parts", frequency: "weekly", priority: 0.7 },
  { path: "/brands", frequency: "weekly", priority: 0.7 },
  { path: "/cities", frequency: "weekly", priority: 0.7 },
  { path: "/dealers", frequency: "weekly", priority: 0.6 },
  { path: "/compare", frequency: "weekly", priority: 0.7 },
  { path: "/news", frequency: "daily", priority: 0.8 },
  { path: "/estimate", frequency: "monthly", priority: 0.6 },
  { path: "/emi-calculator", frequency: "monthly", priority: 0.6 },
  { path: "/sell", frequency: "monthly", priority: 0.7 },
  { path: "/verification", frequency: "monthly", priority: 0.5 },
  { path: "/inspection", frequency: "monthly", priority: 0.5 },
  { path: "/about", frequency: "monthly", priority: 0.5 },
  { path: "/contact", frequency: "monthly", priority: 0.5 },
  { path: "/help", frequency: "monthly", priority: 0.5 },
] as const;

function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, cities, makes, articles, listings] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.city.findMany({ select: { slug: true }, orderBy: { name: "asc" } }),
    prisma.vehicleMake.findMany({
      where: { isActive: true },
      select: { slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.newsArticle.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.listing.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      select: { slug: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  return [
    ...PUBLIC_PAGES.map((page) => ({
      url: absoluteUrl(page.path),
      lastModified: new Date(),
      changeFrequency: page.frequency,
      priority: page.priority,
    })),
    ...categories.map((category) => ({
      url: absoluteUrl(`/${category.slug}`),
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...cities.map((city) => ({
      url: absoluteUrl(`/city/${city.slug}`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...makes.map((make) => ({
      url: absoluteUrl(`/brand/${make.slug}`),
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/news/${article.slug}`),
      lastModified: article.publishedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...listings.map((listing) => ({
      url: absoluteUrl(`/listings/${listing.slug}`),
      lastModified: listing.publishedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
