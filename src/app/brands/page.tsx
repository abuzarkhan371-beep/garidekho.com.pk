import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CarFront } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/utils";
import { PageHero } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Browse Vehicle Brands in Pakistan",
  description: "Find active listings by vehicle brand and manufacturer across Pakistan. Explore Toyota, Honda, Suzuki and more on Garidekho.",
  alternates: { canonical: "/brands" },
};

export default async function BrandsPage() {
  const makes = await prisma.vehicleMake.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      _count: { select: { models: true } },
    },
    orderBy: { name: "asc" },
  });

  const counts = await Promise.all(
    makes.map((make) =>
      prisma.listing.count({
        where: { status: "ACTIVE", deletedAt: null, vehicle: { makeId: make.id } },
      }),
    ),
  );

  const makesWithListings = makes
    .map((make, index) => ({ ...make, listingCount: counts[index] ?? 0 }))
    .filter((make) => make.listingCount > 0);

  return (
    <>
      <PageHero
        eyebrow="Brand directory"
        title="Browse by brand"
        description="Every manufacturer with active listings on Garidekho. Counts are read from the live catalogue and include cars, bikes and commercial vehicles."
        breadcrumb={[{ label: "Brands", href: "/brands" }]}
      >
        <p className="text-sm font-semibold text-ink-600 dark:text-ink-300">{makesWithListings.length} brands with active listings</p>
      </PageHero>

      <div className="container-gdk py-10 lg:py-14">
        {makesWithListings.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {makesWithListings.map((make) => (
              <Link
                key={make.slug}
                href={`/brand/${make.slug}`}
                className="surface-card group flex items-center justify-between gap-3 rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-float"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-50 dark:bg-ink-800">
                    {make.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={make.logoUrl} alt="" className="size-full object-contain" />
                    ) : (
                      <CarFront className="size-5 text-link" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink-900 group-hover:text-link dark:text-white dark:group-hover:text-link-soft">{make.name}</span>
                    <span className="block text-xs text-ink-500">
                      {formatNumber(make.listingCount)} listings · {formatNumber(make._count.models)} models
                    </span>
                    {make.description && <span className="mt-1 block truncate text-[0.7rem] text-ink-400">{make.description}</span>}
                  </span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-ink-300 group-hover:text-link" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="surface-card rounded-xl p-8 text-center">
            <h2 className="font-display text-lg font-bold">No brands with active listings yet</h2>
            <p className="mt-2 text-sm text-ink-500">Check back after the next moderation cycle or browse the live search results.</p>
          </div>
        )}
      </div>
    </>
  );
}
