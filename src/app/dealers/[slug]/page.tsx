import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, CarFront, Globe, Mail, MapPin, Phone, Star, Store,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { listingInclude, toListingCard } from "@/lib/data/listings";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/listing-card";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dealer = await prisma.dealer.findFirst({
    where: { slug, isActive: true },
    select: { businessName: true, description: true },
  });
  if (!dealer) return { title: "Dealer not found" };
  return {
    title: `${dealer.businessName} — verified dealer`,
    description: dealer.description?.slice(0, 160) ?? `Browse active listings from ${dealer.businessName} on Garidekho.`,
    alternates: { canonical: `/dealers/${slug}` },
  };
}

export default async function DealerDetailPage({ params }: Props) {
  const { slug } = await params;
  const dealer = await prisma.dealer.findFirst({
    where: { slug, isActive: true },
    include: {
      city: true,
      province: true,
      listings: {
        where: { status: "ACTIVE", deletedAt: null },
        include: listingInclude,
        orderBy: { publishedAt: "desc" },
      },
    },
  });
  if (!dealer) notFound();

  const cards = dealer.listings.map(toListingCard);
  const location = [dealer.address, dealer.city?.name, dealer.province?.name].filter(Boolean).join(", ");

  return (
    <div className="container-gdk py-8 lg:py-12">
      <Link href="/dealers" className="flex min-h-10 items-center gap-1.5 text-sm font-bold text-link hover:underline">
        <ArrowLeft className="size-4" /> All dealers
      </Link>

      <section className="surface-card mt-5 overflow-hidden rounded-xl">
        {dealer.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dealer.coverUrl}
            alt=""
            className="h-40 w-full object-cover sm:h-56"
            loading="eager"
            fetchPriority="high"
          />
        )}
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-7">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-50 font-display text-2xl font-extrabold text-link">
            {dealer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dealer.logoUrl}
                alt={`${dealer.businessName} logo`}
                className="size-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              dealer.businessName.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{dealer.businessName}</h1>
              {dealer.verificationStatus === "VERIFIED" && (
                <Badge variant="success"><BadgeCheck className="size-3.5" /> Verified</Badge>
              )}
            </div>
            {dealer.description && <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-500">{dealer.description}</p>}

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
              {location && <span className="flex items-center gap-1.5"><MapPin className="size-4 text-link" /> {location}</span>}
              <span className="flex items-center gap-1.5"><Star className="size-4 text-cta" /> {dealer.ratingAvg.toFixed(1)} ({dealer.ratingCount} reviews)</span>
              <span className="flex items-center gap-1.5"><CarFront className="size-4 text-link" /> {formatNumber(dealer.totalSales)} sales</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <a href={`tel:${dealer.phone}`} aria-label={`Call ${dealer.businessName}`}><Phone /> Call dealer</a>
              </Button>
              {dealer.whatsapp && (
                <Button asChild variant="outline">
                  <a
                    href={`https://wa.me/${dealer.whatsapp.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Chat on WhatsApp
                  </a>
                </Button>
              )}
              {dealer.website && (
                <Button asChild variant="ghost">
                  <a href={dealer.website} target="_blank" rel="noopener noreferrer"><Globe /> Website</a>
                </Button>
              )}
              {dealer.email && (
                <a
                  href={`mailto:${dealer.email}`}
                  className="flex min-h-10 items-center gap-1.5 text-sm font-bold text-link hover:underline"
                >
                  <Mail className="size-4" /> Email
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="dealer-listings-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Inventory</p>
            <h2 id="dealer-listings-title" className="mt-2 font-display text-2xl font-extrabold">Active listings</h2>
          </div>
          <p className="text-sm text-ink-500">{cards.length} {cards.length === 1 ? "vehicle" : "vehicles"}</p>
        </div>

        {cards.length === 0 ? (
          <div className="surface-card mt-5 rounded-xl px-6 py-20 text-center">
            <Store className="mx-auto size-12 text-ink-300" />
            <h3 className="mt-4 font-display text-lg font-bold">No active listings right now</h3>
            <p className="mt-1 text-sm text-ink-500">Check back soon or browse similar vehicles from other sellers.</p>
            <Button asChild className="mt-5"><Link href="/search">Browse vehicles</Link></Button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        )}
      </section>
    </div>
  );
}
