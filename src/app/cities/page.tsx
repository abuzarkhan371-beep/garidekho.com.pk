import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatNumber } from "@/lib/utils";
import { PageHero } from "@/components/content/page-hero";

export const metadata: Metadata = {
  title: "Browse Vehicles by City in Pakistan",
  description: "Find active vehicle listings by city and province across Pakistan, including Lahore, Karachi, Islamabad, Peshawar and Quetta.",
  alternates: { canonical: "/cities" },
};

export default async function CitiesPage() {
  const [provinces, groups] = await Promise.all([
    prisma.province.findMany({
      include: { cities: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.listing.groupBy({
      by: ["cityId"],
      where: { status: "ACTIVE", deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const countByCity = new Map(groups.map((group) => [group.cityId, group._count._all]));
  const total = groups.reduce((sum, group) => sum + group._count._all, 0);

  return (
    <>
      <PageHero
        eyebrow="Location directory"
        title="Browse vehicles by city"
        description="Explore active listings across Pakistan, grouped by province. Counts come directly from the marketplace database and change as listings are published."
        breadcrumb={[{ label: "Cities", href: "/cities" }]}
      >
        <p className="text-sm font-semibold text-ink-600 dark:text-ink-300">
          {formatNumber(total)} active listings across {formatNumber(provinces.reduce((sum, province) => sum + province.cities.length, 0))} cities
        </p>
      </PageHero>

      <div className="container-gdk space-y-10 py-10 lg:py-14">
        {provinces.map((province) => (
          <section key={province.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-bold text-ink-950 dark:text-white">{province.name}</h2>
              <p className="text-xs text-ink-500">Capital: {province.capital ?? "—"} · {province.cities.length} cities</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {province.cities.map((city) => (
                <Link
                  key={city.id}
                  href={`/city/${city.slug}`}
                  className="surface-card group flex items-center justify-between gap-3 rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-float"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-link" />
                    <span>
                      <span className="block truncate text-sm font-bold text-ink-900 group-hover:text-link dark:text-white dark:group-hover:text-link-soft">{city.name}</span>
                      <span className="block text-xs text-ink-500">{formatNumber(countByCity.get(city.id) ?? 0)} listings</span>
                    </span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-ink-300 group-hover:text-link" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
