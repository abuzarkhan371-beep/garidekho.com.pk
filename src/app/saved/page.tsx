import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Search } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listingInclude, toListingCard } from "@/lib/data/listings";
import { ListingCard } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Saved vehicles",
  robots: { index: false, follow: false },
};

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/saved");

  const favourites = await prisma.favourite.findMany({
    where: { userId: user.id },
    include: { listing: { include: listingInclude } },
    orderBy: { createdAt: "desc" },
  });
  const cards = favourites.map((favourite) => toListingCard(favourite.listing));

  return (
    <div className="container-gdk py-8 lg:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Your shortlist</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Saved vehicles</h1>
          <p className="mt-2 text-sm text-ink-500">
            {cards.length === 0 ? "Vehicles you save will be waiting here." : `${cards.length} ${cards.length === 1 ? "vehicle" : "vehicles"} saved`}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/search"><Search /> Browse vehicles</Link>
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="surface-card mt-8 rounded-xl px-6 py-20 text-center">
          <Heart className="mx-auto size-12 text-ink-300" />
          <h2 className="mt-4 font-display text-xl font-bold">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            Tap the heart on any listing to keep it here while you compare your options.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild><Link href="/search">Search vehicles</Link></Button>
            <Button asChild variant="outline"><Link href="/cars">Browse cars</Link></Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      )}
    </div>
  );
}
