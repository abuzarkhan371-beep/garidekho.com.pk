"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { BadgeCheck, Camera, Heart, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatNumber, formatPrice, timeAgo } from "@/lib/utils";
import type { ListingCardData } from "@/lib/data/listings";

export function ListingCard({ listing, compact = false }: { listing: ListingCardData; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  const href = `/listings/${listing.slug}`;

  async function toggleSave(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const response = await fetch(`/api/favourites/${listing.id}`, { method: "POST" });
    if (response.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(href)}`;
      return;
    }
    if (response.ok) {
      const data = (await response.json()) as { saved: boolean };
      setSaved(data.saved);
    }
  }

  return (
    <article
      className={cn(
        "group surface-card relative flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-float",
        compact && "flex-row gap-3",
      )}
    >
      <Link href={href} className={cn("relative block overflow-hidden bg-ink-100", compact ? "size-28 shrink-0 rounded-xl" : "aspect-[4/3]")}>
        {listing.image ? (
          <Image
            src={listing.image}
            alt={listing.title}
            fill
            sizes={compact ? "112px" : "(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-ink-400"><Camera className="size-8" /></div>
        )}
        {!compact && (
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {listing.isFeatured && <Badge variant="signal" className="shadow-sm"><Star className="size-3 fill-current" /> Featured</Badge>}
            {listing.isVerified && <Badge variant="success" className="shadow-sm"><BadgeCheck className="size-3" /> Verified</Badge>}
          </div>
        )}
        {!compact && (
          <span className="absolute bottom-2 right-2.5 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[0.68rem] font-semibold text-white">
            <Camera className="size-3" /> {listing.imageCount}
          </span>
        )}
      </Link>

      <div className={cn("flex flex-1 flex-col p-3.5", compact && "p-0 py-1")}>
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="line-clamp-2 text-sm font-bold leading-snug text-ink-900 transition-colors hover:text-link dark:text-white dark:hover:text-link-soft">
            {listing.title}
          </Link>
          <button
            type="button"
            onClick={toggleSave}
            aria-label={saved ? "Remove from saved" : "Save vehicle"}
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors",
              saved
                ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950"
                : "border-ink-100 text-ink-400 hover:border-red-200 hover:text-red-500 dark:border-ink-700",
            )}
          >
            <Heart className={cn("size-4", saved && "fill-current")} />
          </button>
        </div>

        <p className="mt-1.5 text-base font-extrabold text-cta-ink dark:text-cta">{formatPrice(listing.price)}</p>
        {listing.negotiable && <p className="text-[0.68rem] font-medium text-ink-400">Negotiable</p>}

        {!compact && (
          <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-ink-100 pt-3 text-[0.72rem] text-ink-500 dark:border-ink-800">
            <span>{listing.year}</span>
            <span>{formatNumber(listing.mileageKm)} km</span>
            <span>{listing.transmission?.replaceAll("_", " ") ?? "—"}</span>
            <span>{listing.fuelType?.replaceAll("_", " ") ?? "—"}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[0.7rem] text-ink-400">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{listing.city ?? "Pakistan"}{listing.dealer ? ` · ${listing.dealer}` : ""}</span>
          </span>
          <span className="shrink-0">{timeAgo(listing.publishedAt ?? listing.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}
