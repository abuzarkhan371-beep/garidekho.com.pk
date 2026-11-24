import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Suggestion = { label: string; value: string; type: string };

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const contains = { contains: q, mode: "insensitive" as const };
  const [makes, models, cities, listings] = await Promise.all([
    prisma.vehicleMake.findMany({ where: { name: contains, isActive: true }, select: { name: true, slug: true }, take: 3 }),
    prisma.vehicleModel.findMany({ where: { name: contains, isActive: true }, select: { name: true, slug: true, make: { select: { name: true } } }, take: 3 }),
    prisma.city.findMany({ where: { name: contains }, select: { name: true, slug: true }, take: 2 }),
    prisma.listing.findMany({
      where: { status: "ACTIVE", deletedAt: null, title: contains },
      select: { title: true, slug: true },
      take: 3,
    }),
  ]);

  const suggestions: Suggestion[] = [
    ...makes.map((item) => ({ label: item.name, value: item.slug, type: "brand" })),
    ...models.map((item) => ({ label: `${item.make.name} ${item.name}`, value: item.slug, type: "model" })),
    ...cities.map((item) => ({ label: item.name, value: item.slug, type: "city" })),
    ...listings.map((item) => ({ label: item.title, value: item.slug, type: "listing" })),
  ].slice(0, 8);

  return NextResponse.json({ suggestions });
}
