import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, BadgeCheck, Building2, CarFront, ChevronRight, Clock3,
  FileCheck2, Headphones, MapPin, Newspaper, ShieldCheck, Tag,
  UserRoundCheck, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowseUsedCars } from "@/components/home/browse-used-cars";
import { CarComparison } from "@/components/home/car-comparison";
import { FeaturedNewCars } from "@/components/home/featured-new-cars";
import { HeroSearch } from "@/components/home/hero-search";
import { LatestNewsAbout } from "@/components/home/latest-news-about";
import { LatestUsedCars } from "@/components/home/latest-used-cars";
import { ListingCard } from "@/components/listings/listing-card";
import { Badge } from "@/components/ui/badge";
import { AdminEditLink } from "@/components/admin/admin-edit-link";
import { prisma } from "@/lib/db";
import { getComparisonSets } from "@/lib/data/comparison";
import {
  getFeaturedListings, getLatestListings, getListingCount,
} from "@/lib/data/listings";
import {
  getNewCarComparisonSets, getNewCars, groupNewCarsByTab,
} from "@/lib/data/new-cars";
import { BUDGET_RANGES } from "@/lib/constants";
import { DEFAULT_CUSTOMIZER_CONFIG, renderCustomizerText } from "@/lib/customizer/config";
import { getSiteCustomizer } from "@/lib/customizer/server";
import { formatNumber } from "@/lib/utils";

export const revalidate = 120;

export default async function HomePage() {
  const [
    makes,
    cities,
    models,
    featured,
    latest,
    comparisonSets,
    newCarSets,
    newCars,
    dealers,
    articles,
    activeCount,
    cityCount,
    customizer,
  ] = await Promise.all([
    prisma.vehicleMake.findMany({
      where: { isActive: true },
      select: {
        name: true,
        slug: true,
        logoUrl: true,
        models: {
          where: { isActive: true },
          select: {
            name: true,
            slug: true,
            _count: {
              select: {
                vehicles: { where: { listing: { status: "ACTIVE", deletedAt: null } } },
              },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    }),
    prisma.city.findMany({
      where: { isMajor: true },
      select: {
        name: true, slug: true, imageUrl: true,
        _count: { select: { listings: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { name: "asc" },
      take: 12,
    }),
    prisma.vehicleModel.findMany({
      where: { isActive: true },
      select: {
        name: true,
        slug: true,
        make: { select: { name: true, slug: true } },
        _count: {
          select: {
            vehicles: { where: { listing: { status: "ACTIVE", deletedAt: null } } },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 80,
    }),
    getFeaturedListings(8),
    getLatestListings(8),
    getComparisonSets(4),
    getNewCarComparisonSets(5),
    getNewCars(),
    prisma.dealer.findMany({
      where: { verificationStatus: "VERIFIED", isActive: true },
      include: { city: true, _count: { select: { listings: { where: { status: "ACTIVE" } } } } },
      take: 4,
    }),
    prisma.newsArticle.findMany({
      where: { status: "PUBLISHED" },
      select: { title: true, slug: true, excerpt: true, coverUrl: true, category: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    getListingCount(),
    prisma.city.count(),
    getSiteCustomizer(),
  ]);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink-950 pb-28 pt-12 text-white sm:pt-16 lg:pb-36 lg:pt-20">
        <div className="absolute inset-0">
          <Image
            src={customizer.media.heroBanner || DEFAULT_CUSTOMIZER_CONFIG.media.heroBanner}
            alt="Premium car on an open road"
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/90 to-ink-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
        </div>

        <div className="container-gdk relative">
          <div className="max-w-3xl">
            <Badge variant="signal" className="mb-5 gap-1.5 bg-signal-400/15 px-3 py-1 text-signal-300">
              <span className="size-1.5 rounded-full bg-signal-300" /> Now live across {cityCount} Pakistani cities
            </Badge>
            <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {renderCustomizerText(customizer.content.heroTitle)}{" "}
              <span className="text-link-soft">{renderCustomizerText(customizer.content.heroAccent)}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-200 sm:text-lg">
              {renderCustomizerText(customizer.content.heroSubtitle)}
            </p>
          </div>

          <div className="mt-9 max-w-6xl">
            <HeroSearch
              cities={cities}
              placeholder={customizer.content.searchPlaceholder}
              buttonLabel={customizer.content.searchButton}
            />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-ink-300">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-link-soft" /> Moderated listings</span>
            <span className="flex items-center gap-2"><UserRoundCheck className="size-4 text-link-soft" /> Verified sellers</span>
            <span className="flex items-center gap-2"><MapPin className="size-4 text-link-soft" /> Nationwide coverage</span>
            <span className="flex items-center gap-2"><FileCheck2 className="size-4 text-link-soft" /> Detailed vehicle history</span>
          </div>
        </div>
      </section>

      <div className="container-gdk relative z-10 -mt-20 lg:-mt-24">
        {/* TRUST STRIP */}
        <div className="surface-card grid grid-cols-2 gap-4 rounded-xl p-5 md:grid-cols-4 md:p-6">
          {[
            { value: formatNumber(activeCount), label: "Live listings", icon: Tag },
            { value: formatNumber(cityCount), label: "Cities covered", icon: MapPin },
            { value: String(makes.length), label: "Vehicle brands", icon: CarFront },
            { value: "100%", label: "Listings reviewed", icon: ShieldCheck },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-signal-50 text-link dark:bg-link/10 dark:text-link-soft">
                <item.icon className="size-5" />
              </span>
              <div>
                <p className="font-display text-xl font-extrabold leading-none text-ink-900 dark:text-white">{item.value}</p>
                <p className="mt-1 text-xs font-medium text-ink-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-gdk space-y-16 py-14 lg:space-y-20 lg:py-20">
        <BrowseUsedCars
          brands={makes.map((make) => ({
            name: make.name,
            slug: make.slug,
            logoUrl: make.logoUrl,
          }))}
          models={models.map((model) => ({
            name: model.name,
            makeName: model.make.name,
            makeSlug: model.make.slug,
            slug: model.slug,
            count: model._count.vehicles,
          }))}
        />

        {/* FEATURED */}
        <section aria-labelledby="featured-title">
          <SectionHeading
            eyebrow="Handpicked"
            title="Featured listings"
            description="Handpicked cars for sale in Pakistan from serious sellers, verified by our moderation team."
            href="/search?featured=true"
            linkLabel="View all featured"
            adminAction={<AdminEditLink href="/admin/featured" label="Manage featured" capability="canPromote" />}
          />
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.slice(0, 4).map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        </section>

        <LatestUsedCars listings={latest.slice(0, 8)} />

        <FeaturedNewCars cars={groupNewCarsByTab(newCars)} />

        <CarComparison sets={comparisonSets} newSets={newCarSets} />

        {/* BUDGET */}
        <section aria-labelledby="budget-title" className="overflow-hidden rounded-3xl bg-ink-950 p-6 text-white sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-link-soft">Budget discovery</p>
              <h2 id="budget-title" className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Find a car that fits your budget</h2>
              <p className="mt-3 text-sm text-ink-300">Compare price in Pakistan across popular budgets and see verified vehicles available right now.</p>
            </div>
            <Button asChild variant="signal"><Link href="/search">Explore all cars <ArrowRight /></Link></Button>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {BUDGET_RANGES.map((range) => (
              <Link
                key={range.slug}
                href={`/search?maxPrice=${range.max ?? ""}${range.min ? `&minPrice=${range.min}` : ""}`}
                className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-4 transition-colors hover:border-link/60 hover:bg-link/10"
              >
                <span className="text-sm font-semibold">{range.label}</span>
                <ArrowRight className="size-4 text-link-soft transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>

        {/* EDITABLE PROMOTIONAL BANNERS */}
        {customizer.media.promoBanners.some((banner) => banner.url) && (
          <section aria-label="Promotions" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customizer.media.promoBanners.filter((banner) => banner.url).map((banner, index) => (
              <Link
                key={`${banner.url}-${index}`}
                href={banner.href || "/search"}
                className="group relative block aspect-[16/9] overflow-hidden rounded-xl bg-ink-100"
              >
                <Image
                  src={banner.url}
                  alt={banner.alt || "Promotion"}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent px-4 py-3 text-sm font-bold text-white">
                  {banner.alt || "Explore more"}
                </span>
              </Link>
            ))}
          </section>
        )}

        {/* CITIES */}
        <section aria-labelledby="cities-title">
          <SectionHeading
            eyebrow="Near you"
            title="Popular cities"
            description="Browse cars for sale in Pakistan in Lahore, Karachi, Islamabad and other major markets."
            href="/cities"
            linkLabel="All cities"
          />
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {cities.slice(0, 12).map((city) => (
              <Link
                key={city.slug}
                href={`/city/${city.slug}`}
                className="surface-card group flex items-center justify-between rounded-xl px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-link"
              >
                <span>
                  <span className="block text-sm font-bold">{city.name}</span>
                  <span className="text-xs text-ink-500">{city._count.listings} ads</span>
                </span>
                <ChevronRight className="size-4 text-link transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>

        {/* VERIFIED DEALERS */}
        <section aria-labelledby="dealers-title">
          <SectionHeading
            eyebrow="Trusted partners"
            title="Verified sellers & dealers"
            description="Businesses that have completed our identity and inventory verification."
            href="/dealers"
            linkLabel="Browse dealers"
          />
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dealers.map((dealer) => (
              <Link key={dealer.id} href={`/dealers/${dealer.slug}`} className="surface-card group rounded-xl p-5 transition-all hover:-translate-y-1 hover:shadow-float">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-navy font-display text-base font-extrabold text-white dark:bg-ink-800">
                    {dealer.businessName.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate text-sm font-bold"><span className="truncate">{dealer.businessName}</span><BadgeCheck className="size-4 shrink-0 text-link" /></p>
                    <p className="text-xs text-ink-500">{dealer.city?.name ?? "Pakistan"}</p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 min-h-10 text-xs leading-relaxed text-ink-500">{dealer.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-xs dark:border-ink-800">
                  <span className="font-semibold text-ink-700 dark:text-ink-200">{dealer._count.listings} live ads</span>
                  <span className="text-ink-400">{dealer.ratingAvg.toFixed(1)} ★ ({dealer.ratingCount})</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* WHY CHOOSE */}
        <section aria-labelledby="why-title" className="surface-card rounded-3xl p-6 sm:p-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Why Garidekho</p>
            <h2 id="why-title" className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              {renderCustomizerText(customizer.content.aboutTitle)}
            </h2>
            <p className="mt-3 text-sm text-ink-500">{renderCustomizerText(customizer.content.aboutText)}</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Moderated listings", body: "Our team reviews every ad before it goes live, reducing scams and duplicates." },
              { icon: BadgeCheck, title: "Verified identities", body: "Phone and seller verification badges help you deal with real people." },
              { icon: Building2, title: "Dealer accountability", body: "Public dealer storefronts with ratings, inventory and business details." },
              { icon: Headphones, title: "Local support", body: "A support team that understands Pakistani documentation, cities and buying norms." },
            ].map((item) => (
              <div key={item.title}>
                <span className="flex size-11 items-center justify-center rounded-xl bg-signal-50 text-link dark:bg-link/10 dark:text-link-soft"><item.icon className="size-5" /></span>
                <h3 className="mt-4 text-sm font-bold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* APP / SELL CTA */}
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-navy p-7 text-white sm:p-9">
            <Zap className="size-7 text-signal-300" />
            <h2 className="mt-4 font-display text-2xl font-extrabold sm:text-3xl">
              {renderCustomizerText(customizer.content.ctaTitle)}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-300">
              {renderCustomizerText(customizer.content.ctaText)}
            </p>
            <Button asChild variant="signal" className="mt-6">
              <Link href="/sell">{renderCustomizerText(customizer.content.ctaButton)} <ArrowRight /></Link>
            </Button>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-link-ink p-7 text-white sm:p-9">
            <Newspaper className="size-7 text-white/80" />
            <h2 className="mt-4 font-display text-2xl font-extrabold sm:text-3xl">Take Garidekho with you</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
              Our mobile-first experience works beautifully on your phone. Add Garidekho to your home screen for
              instant access to new listings and saved searches.
            </p>
            <Button asChild variant="outline" className="mt-6 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link href="/app">How to install <ArrowRight /></Link>
            </Button>
          </div>
        </section>

        <LatestNewsAbout
          articles={articles}
          aboutTitle={renderCustomizerText(customizer.content.aboutTitle)}
          aboutText={renderCustomizerText(customizer.content.aboutText)}
        />
      </div>
    </>
  );
}

function SectionHeading({
  eyebrow, title, description, href, linkLabel, adminAction,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  adminAction?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">{eyebrow}</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">{title}</h2>
        <p className="mt-2 text-sm text-ink-500">{description}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {adminAction}
        <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-bold text-link dark:text-link-soft">
          {linkLabel} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
