import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { listingInclude, toListingCard } from "@/lib/data/listings";
import { ListingCard } from "@/components/listings/listing-card";
import { formatNumber } from "@/lib/utils";
import { PageHero, ContentSection } from "@/components/content/page-hero";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const cities = await prisma.city.findMany({ select: { slug: true }, orderBy: { name: "asc" } });
  return cities.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = await prisma.city.findUnique({
    where: { slug },
    select: { name: true, description: true, province: { select: { name: true } } },
  });
  if (!city) return { title: "City not found" };

  const description = city.description ?? `Browse active cars and bikes for sale in ${city.name}, ${city.province.name}, on Garidekho.`;
  return {
    title: `Cars & Bikes for Sale in ${city.name}`,
    description,
    alternates: { canonical: `/city/${slug}` },
    openGraph: { title: `Vehicles for sale in ${city.name}`, description, url: `/city/${slug}`, type: "website" },
  };
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const city = await prisma.city.findUnique({
    where: { slug },
    include: { province: true, areas: { orderBy: { name: "asc" } } },
  });
  if (!city) notFound();

  const [listings, countGroups, areaGroups, nearbyCities] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", deletedAt: null, cityId: city.id },
      include: listingInclude,
      orderBy: { publishedAt: "desc" },
      take: 9,
    }),
    prisma.listing.groupBy({
      by: ["cityId"],
      where: { status: "ACTIVE", deletedAt: null },
      _count: { _all: true },
    }),
    prisma.listing.groupBy({
      by: ["areaId"],
      where: { status: "ACTIVE", deletedAt: null, cityId: city.id },
      _count: { _all: true },
    }),
    prisma.city.findMany({
      where: { provinceId: city.provinceId, id: { not: city.id } },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
      take: 8,
    }),
  ]);

  const total = countGroups.find((group) => group.cityId === city.id)?._count._all ?? 0;
  const areaCounts = new Map(areaGroups.map((group) => [group.areaId, group._count._all]));
  const cityCounts = new Map(countGroups.map((group) => [group.cityId, group._count._all]));
  const cards = listings.map(toListingCard);

  return (
    <>
      <PageHero
        eyebrow={`${city.province.name} · Pakistan`}
        title={`Vehicles for sale in ${city.name}`}
        description={city.description ?? `Browse verified cars, bikes and commercial vehicles listed by owners and dealers in ${city.name}. Check prices, mileage and seller verification before you contact anyone.`}
        breadcrumb={[{ label: "Cities", href: "/cities" }, { label: city.name, href: `/city/${slug}` }]}
      >
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-ink-600 dark:text-ink-300">
          <span className="rounded-full bg-white px-3 py-1.5 dark:bg-ink-800">{formatNumber(total)} active listings</span>
          <span className="rounded-full bg-white px-3 py-1.5 dark:bg-ink-800">{city.areas.length} mapped areas</span>
          <span className="rounded-full bg-white px-3 py-1.5 dark:bg-ink-800">{city.province.name}</span>
        </div>
      </PageHero>

      <div className="container-gdk space-y-10 py-10 lg:py-14">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">Latest listings in {city.name}</h2>
              <p className="mt-1 text-xs text-ink-500">Active and moderated listings only.</p>
            </div>
            <Link href={`/search?city=${slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline dark:text-link-soft">
              See all search results <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {cards.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {cards.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className="surface-card mt-5 rounded-xl p-8 text-center">
              <MapPin className="mx-auto size-8 text-ink-300" />
              <h3 className="mt-3 font-display text-lg font-bold">No active listings in {city.name} yet</h3>
              <p className="mt-2 text-sm text-ink-500">Try a nearby city or post a listing yourself.</p>
              <Link href="/sell" className="mt-4 inline-flex h-10 items-center rounded-xl bg-cta px-4 text-sm font-semibold text-white hover:bg-cta-hover">Post an ad</Link>
            </div>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <ContentSection title={`Popular areas in ${city.name}`}>
            {city.areas.length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {city.areas.map((area) => (
                  <li key={area.id}>
                    <Link
                      href={`/search?city=${slug}&q=${encodeURIComponent(area.name)}`}
                      className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm hover:border-link dark:border-ink-800 dark:bg-ink-900"
                    >
                      <span>{area.name}</span>
                      <span className="text-xs text-ink-500">{formatNumber(areaCounts.get(area.id) ?? 0)} ads</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No areas have been mapped for this city yet.</p>
            )}
          </ContentSection>

          <ContentSection title="Nearby cities">
            {nearbyCities.length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {nearbyCities.map((nearby) => (
                  <li key={nearby.slug}>
                    <Link
                      href={`/city/${nearby.slug}`}
                      className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm hover:border-link dark:border-ink-800 dark:bg-ink-900"
                    >
                      <span>{nearby.name}</span>
                      <span className="text-xs text-ink-500">
                        {formatNumber(cityCounts.get(nearby.id) ?? 0)} listings
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>This is the only city currently listed in {city.province.name}.</p>
            )}
          </ContentSection>
        </div>

        <ContentSection title={`Buying and selling in ${city.name}`}>
          <p>
            {city.name} is part of {city.province.name}. Prices vary by area, registration, mileage and condition, so
            compare live results with the <Link href="/estimate" className="font-semibold text-link hover:underline dark:text-link-soft">market estimator</Link>
            before negotiating. Verify the seller&apos;s phone number and consider an <Link href="/inspection" className="font-semibold text-link hover:underline dark:text-link-soft">inspection</Link> before paying.
          </p>
          <p>
            Browse <Link href="/brands" className="font-semibold text-link hover:underline dark:text-link-soft">all brands</Link>,
            view <Link href="/cities" className="font-semibold text-link hover:underline dark:text-link-soft">all cities</Link>, or
            start with <Link href="/cars" className="font-semibold text-link hover:underline dark:text-link-soft">cars</Link> and
            <Link href="/bikes" className="font-semibold text-link hover:underline dark:text-link-soft"> bikes</Link>.
          </p>
        </ContentSection>
      </div>
    </>
  );
}
