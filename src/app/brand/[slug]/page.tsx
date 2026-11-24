import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CarFront } from "lucide-react";
import { prisma } from "@/lib/db";
import { listingInclude, toListingCard } from "@/lib/data/listings";
import { ListingCard } from "@/components/listings/listing-card";
import { formatNumber } from "@/lib/utils";
import { PageHero, ContentSection } from "@/components/content/page-hero";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const makes = await prisma.vehicleMake.findMany({ where: { isActive: true }, select: { slug: true } });
  return makes.map((make) => ({ slug: make.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const make = await prisma.vehicleMake.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!make) return { title: "Brand not found" };

  const description = make.description ?? `Browse active ${make.name} listings for sale across Pakistan on Garidekho.`;
  return {
    title: `${make.name} Cars & Bikes for Sale in Pakistan`,
    description,
    alternates: { canonical: `/brand/${slug}` },
    openGraph: { title: `${make.name} vehicles for sale in Pakistan`, description, url: `/brand/${slug}`, type: "website" },
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const make = await prisma.vehicleMake.findUnique({
    where: { slug },
    include: {
      models: {
        where: { isActive: true },
        include: { variants: { where: { isActive: true }, orderBy: { name: "asc" } } },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!make || !make.isActive) notFound();

  const makeFilter = { vehicle: { makeId: make.id } };
  const [listings, total, cityGroups] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", deletedAt: null, ...makeFilter },
      include: listingInclude,
      orderBy: { publishedAt: "desc" },
      take: 9,
    }),
    prisma.listing.count({ where: { status: "ACTIVE", deletedAt: null, ...makeFilter } }),
    prisma.listing.groupBy({
      by: ["cityId"],
      where: { status: "ACTIVE", deletedAt: null, ...makeFilter },
      _count: { _all: true },
    }),
  ]);

  const cityIds = cityGroups.map((group) => group.cityId).filter((id): id is string => Boolean(id));
  const cities = cityIds.length > 0
    ? await prisma.city.findMany({ where: { id: { in: cityIds } }, select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } })
    : [];
  const cityCount = new Map(cityGroups.map((group) => [group.cityId, group._count._all]));
  const cards = listings.map(toListingCard);

  return (
    <>
      <PageHero
        eyebrow="Brand directory"
        title={`${make.name} vehicles for sale in Pakistan`}
        description={make.description ?? `Browse active ${make.name} cars and bikes listed by verified owners and dealers across Pakistan.`}
        breadcrumb={[{ label: "Brands", href: "/brands" }, { label: make.name, href: `/brand/${slug}` }]}
      >
        <div className="flex flex-wrap gap-3 text-xs font-semibold text-ink-600 dark:text-ink-300">
          <span className="rounded-full bg-white px-3 py-1.5 dark:bg-ink-800">{formatNumber(total)} active listings</span>
          <span className="rounded-full bg-white px-3 py-1.5 dark:bg-ink-800">{make.models.length} models</span>
        </div>
      </PageHero>

      <div className="container-gdk space-y-10 py-10 lg:py-14">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">Latest {make.name} listings</h2>
              <p className="mt-1 text-xs text-ink-500">Active, moderated listings from across Pakistan.</p>
            </div>
            <Link href={`/search?make=${slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline dark:text-link-soft">
              View all results <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {cards.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {cards.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className="surface-card mt-5 rounded-xl p-8 text-center">
              <CarFront className="mx-auto size-8 text-ink-300" />
              <h3 className="mt-3 font-display text-lg font-bold">No active {make.name} listings yet</h3>
              <p className="mt-2 text-sm text-ink-500">Try another brand or post your own vehicle.</p>
              <Link href="/sell" className="mt-4 inline-flex h-10 items-center rounded-xl bg-cta px-4 text-sm font-semibold text-white hover:bg-cta-hover">Post an ad</Link>
            </div>
          )}
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <ContentSection title={`${make.name} models`}>
            {make.models.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {make.models.map((model) => (
                  <Link
                    key={model.id}
                    href={`/search?make=${slug}&model=${model.slug}`}
                    className="rounded-xl border border-ink-100 bg-white p-3 text-sm transition-colors hover:border-link dark:border-ink-800 dark:bg-ink-900"
                  >
                    <span className="block font-semibold text-ink-900 dark:text-white">{model.name}</span>
                    <span className="block text-xs text-ink-500">{model.variants.length} variants</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p>No models have been added to this brand yet.</p>
            )}
          </ContentSection>

          <ContentSection title="Cities with listings">
            {cities.length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {cities.map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={`/search?make=${slug}&city=${city.slug}`}
                      className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm hover:border-link dark:border-ink-800 dark:bg-ink-900"
                    >
                      <span>{city.name}</span>
                      <span className="text-xs text-ink-500">{formatNumber(cityCount.get(city.id) ?? 0)} ads</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No city data available for this brand yet.</p>
            )}
          </ContentSection>
        </div>

        <ContentSection title="Research before you buy">
          <p>
            Compare asking prices against the <Link href="/estimate" className="font-semibold text-link hover:underline dark:text-link-soft">market estimator</Link>,
            calculate financing with the <Link href="/emi-calculator" className="font-semibold text-link hover:underline dark:text-link-soft">EMI calculator</Link>,
            and read <Link href="/verification" className="font-semibold text-link hover:underline dark:text-link-soft">what verification means</Link> before contacting a seller.
          </p>
        </ContentSection>
      </div>
    </>
  );
}
