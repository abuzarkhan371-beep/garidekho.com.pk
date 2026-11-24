import type { Metadata } from "next";
import Link from "next/link";
import { CarFront, Clock3, FileEdit, Plus } from "lucide-react";
import { getSessionActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "My ads", robots: { index: false, follow: false } };

export default async function MyAdsPage() {
  const actor = await getSessionActor();
  const listings = actor
    ? await prisma.listing.findMany({
        where: { userId: actor.user.id, deletedAt: null },
        include: { vehicle: { include: { make: true, model: true } }, images: { orderBy: { position: "asc" }, take: 1 }, city: true },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  if (!actor) {
    return (
      <div className="container-gdk py-16 text-center">
        <CarFront className="mx-auto size-12 text-ink-300" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">No ads on this device</h1>
        <p className="mt-2 text-sm text-ink-500">Verify your phone to post an ad — no account needed.</p>
        <Button asChild className="mt-6"><Link href="/sell"><Plus /> Post an ad</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-gdk py-8 lg:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">My ads</h1>
          <p className="mt-1 text-sm text-ink-500">
            {actor.isGuest ? "Guest session — create an account to keep these ads across devices." : "Track and manage everything you have listed."}
          </p>
        </div>
        <Button asChild><Link href="/sell"><Plus /> Post a new ad</Link></Button>
      </div>

      {actor.isGuest && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-signal-200 bg-signal-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-link/40 dark:bg-link/10">
          <div>
            <p className="font-bold text-link-ink dark:text-link-soft">Keep your ads forever</p>
            <p className="mt-1 text-sm text-link-ink dark:text-link-soft">Register with the same phone number and your ads will move to your new account automatically.</p>
          </div>
          <Button asChild variant="outline"><Link href="/register?claim=1">Create free account</Link></Button>
        </div>
      )}

      {listings.length === 0 ? (
        <div className="surface-card mt-8 rounded-xl px-6 py-20 text-center">
          <CarFront className="mx-auto size-12 text-ink-300" />
          <h2 className="mt-4 font-display text-xl font-bold">You haven&apos;t posted any ads yet</h2>
          <p className="mt-2 text-sm text-ink-500">It takes about five minutes to list a vehicle.</p>
          <Button asChild className="mt-6"><Link href="/sell">Start posting</Link></Button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="surface-card flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center">
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-100">
                {listing.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.images[0].url} alt="" className="size-full object-cover" />
                ) : (
                  <CarFront className="size-8 text-ink-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-bold">{listing.title}</p>
                  <Badge variant={listing.status === "ACTIVE" ? "success" : listing.status === "REJECTED" ? "danger" : "neutral"}>
                    {STATUS_LABELS[listing.status] ?? listing.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-semibold text-cta-ink dark:text-cta">{formatPrice(listing.price)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                  <Clock3 className="size-3" /> Updated {new Date(listing.updatedAt).toLocaleString("en-PK")} · {listing.city?.name ?? "Location not set"}
                </p>
                {listing.rejectionReason && <p className="mt-1 text-xs text-red-600">Reason: {listing.rejectionReason}</p>}
              </div>
              <div className="flex gap-2">
                {listing.status === "DRAFT" ? (
                  <Button asChild size="sm"><Link href="/sell"><FileEdit /> Continue draft</Link></Button>
                ) : (
                  <Button asChild size="sm" variant="outline"><Link href={`/listings/${listing.slug}`}>View ad</Link></Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
