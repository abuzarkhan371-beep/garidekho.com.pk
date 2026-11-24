import Link from "next/link";
import { ArrowRight, CarFront, MapPin, SearchX } from "lucide-react";
import { ListingCard } from "@/components/listings/listing-card";
import type { ListingCardData } from "@/lib/data/listings";
import { PageHero } from "@/components/content/page-hero";

export type CategoryLandingData = {
  name: string;
  slug: string;
  description: string;
  totalListings: number;
  listings: ListingCardData[];
  makes: { name: string; slug: string; modelCount: number; listingCount: number }[];
  cities: { name: string; slug: string; count: number }[];
};

/** Server-rendered landing for the four top-level marketplace categories. */
export function CategoryLanding({ data }: { data: CategoryLandingData }) {
  const { name, slug, description, totalListings, listings, makes, cities } = data;

  return (
    <>
      <PageHero
        eyebrow="Browse marketplace"
        title={`${name} for sale in Pakistan`}
        description={description}
        breadcrumb={[{ label: name, href: `/${slug}` }]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/sell" className="inline-flex h-10 items-center rounded-xl bg-cta px-4 text-sm font-semibold text-white transition-colors hover:bg-cta-hover">
            Post a {slug === "auto-parts" ? "part" : "vehicle"} ad
          </Link>
          <Link href="/search" className="inline-flex h-10 items-center rounded-xl border border-ink-200 px-4 text-sm font-semibold transition-colors hover:border-link hover:text-link dark:border-ink-700">
            Open advanced search
          </Link>
          <span className="text-xs text-ink-500">
            {totalListings} active {totalListings === 1 ? "listing" : "listings"}
          </span>
        </div>
      </PageHero>

      <div className="container-gdk py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-6">
            <section className="surface-card rounded-xl p-5">
              <h2 className="text-sm font-bold text-ink-950 dark:text-white">Popular brands</h2>
              {makes.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {makes.map((make) => (
                    <li key={make.slug}>
                      <Link
                        href={`/search?category=${slug}&make=${make.slug}`}
                        className="flex items-center justify-between gap-2 text-sm text-ink-600 transition-colors hover:text-link dark:text-ink-300 dark:hover:text-link-soft"
                      >
                        <span className="truncate font-medium">{make.name}</span>
                        <span className="shrink-0 text-xs text-ink-400">{make.listingCount} ads · {make.modelCount} models</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-ink-500">No brands have been listed in this category yet.</p>
              )}
            </section>

            <section className="surface-card rounded-xl p-5">
              <h2 className="text-sm font-bold text-ink-950 dark:text-white">Where buyers are looking</h2>
              {cities.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {cities.map((city) => (
                    <li key={city.slug}>
                      <Link
                        href={`/search?category=${slug}&city=${city.slug}`}
                        className="flex items-center justify-between gap-2 text-sm text-ink-600 transition-colors hover:text-link dark:text-ink-300 dark:hover:text-link-soft"
                      >
                        <span className="flex min-w-0 items-center gap-1.5 truncate"><MapPin className="size-3.5 shrink-0" />{city.name}</span>
                        <span className="shrink-0 text-xs text-ink-400">{city.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-ink-500">City data appears here once listings are published.</p>
              )}
            </section>
          </aside>

          <div>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-ink-950 dark:text-white">Latest {name.toLowerCase()} listings</h2>
                <p className="mt-1 text-xs text-ink-500">Only active, moderated listings are shown.</p>
              </div>
              <Link href={`/search?category=${slug}`} className="hidden items-center gap-1 text-xs font-semibold text-link hover:underline sm:inline-flex dark:text-link-soft">
                View all <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {listings.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
              </div>
            ) : (
              <div className="surface-card flex flex-col items-center rounded-xl px-6 py-16 text-center">
                <SearchX className="size-10 text-ink-300" />
                <h3 className="mt-4 font-display text-lg font-bold text-ink-900 dark:text-white">No active listings yet</h3>
                <p className="mt-2 max-w-md text-sm text-ink-500">
                  There are no published {name.toLowerCase()} listings in the database right now.
                  You can be the first to list one, or check back after the next moderation cycle.
                </p>
                <Link href="/sell" className="mt-5 inline-flex h-10 items-center rounded-xl bg-cta px-4 text-sm font-semibold text-white hover:bg-cta-hover">
                  List your {slug === "auto-parts" ? "part" : "vehicle"}
                </Link>
              </div>
            )}

            <section className="surface-card mt-8 rounded-xl p-6">
              <div className="flex items-center gap-2"><CarFront className="size-5 text-link" /><h2 className="font-display text-base font-bold">Buy and sell with confidence</h2></div>
              <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                Every listing goes through moderation. Verified sellers display a badge, and you can request an independent
                inspection before paying. Read our <Link href="/verification" className="font-semibold text-link hover:underline dark:text-link-soft">verification guide</Link>,
                compare prices with the <Link href="/estimate" className="font-semibold text-link hover:underline dark:text-link-soft">market estimator</Link>,
                or review <Link href="/help" className="font-semibold text-link hover:underline dark:text-link-soft">common questions</Link> before you contact a seller.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
