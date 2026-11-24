"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setFeaturedRankAction,
} from "@/app/admin/content/actions";
import { toggleFeaturedAction } from "@/app/admin/actions";
import type { ContentActionState } from "@/lib/admin-content";
import { formatPrice } from "@/lib/utils";

type Message = ContentActionState;
const initial: Message = { ok: false, message: "" };

const selectClass =
  "flex h-11 w-full rounded-xl border border-ink-100 bg-white px-3.5 py-2 text-sm text-ink-900 shadow-sm focus-visible:border-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link/20 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50";

export type FeaturedOption = {
  id: string;
  title: string;
  slug: string;
  price: number;
  image: string;
  rank: number;
};

function Status({ state }: { state: Message }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={`text-sm font-semibold ${state.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
    >
      {state.message}
    </p>
  );
}

export function FeaturedManager({
  featured,
  available,
}: {
  featured: FeaturedOption[];
  available: FeaturedOption[];
}) {
  const [addState, addAction, adding] = useActionState(
    async (_prev: Message, formData: FormData) => toggleFeaturedAction(formData),
    initial,
  );
  const [rankState, rankAction, ranking] = useActionState(
    async (_prev: Message, formData: FormData) => setFeaturedRankAction(formData),
    initial,
  );
  const [removeState, removeAction, removing] = useActionState(
    async (_prev: Message, formData: FormData) => toggleFeaturedAction(formData),
    initial,
  );

  return (
    <div className="space-y-6">
      <div className="surface-card rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-xl font-extrabold">Add a featured ad</h2>
        <p className="mt-1 text-sm text-ink-500">
          Choose an active listing to promote. Higher display ranks appear first on the homepage.
        </p>
        <form action={addAction} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="featured" value="true" />
          <label className="flex-1">
            <span className="mb-1 block text-xs font-semibold">Active listing</span>
            <select name="listingId" className={selectClass} required defaultValue="">
              <option value="" disabled>Select a listing</option>
              {available.map((listing) => (
                <option key={listing.id} value={listing.id}>{listing.title}</option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={adding || available.length === 0}>
            {adding ? "Adding…" : "Add to featured"}
          </Button>
        </form>
        <div className="mt-3"><Status state={addState} /></div>
        {available.length === 0 && (
          <p className="mt-2 text-xs text-ink-500">Every active listing is already featured.</p>
        )}
      </div>

      <div className="surface-card overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <h2 className="font-display text-lg font-bold">Featured ads ({featured.length})</h2>
          <Status state={rankState} />
          <Status state={removeState} />
        </div>
        <div className="divide-y divide-ink-100 dark:divide-ink-800">
          {featured.map((listing) => (
            <div key={listing.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                {listing.image ? <Image src={listing.image} alt="" fill sizes="64px" className="object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/listings/${listing.slug}`} className="truncate font-bold hover:text-link">
                  {listing.title}
                </Link>
                <p className="mt-1 text-xs text-ink-500">{formatPrice(listing.price)} · Rank {listing.rank}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={rankAction} className="flex items-center gap-2">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <Input
                    name="rank"
                    type="number"
                    min={0}
                    max={9999}
                    defaultValue={listing.rank}
                    aria-label={`Display rank for ${listing.title}`}
                    className="h-10 w-20"
                  />
                  <Button type="submit" variant="outline" size="sm" disabled={ranking}>Set rank</Button>
                </form>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/cars?type=used&edit=${listing.id}`}>
                    <Pencil className="size-4" /> Edit
                  </Link>
                </Button>
                <form action={removeAction}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <input type="hidden" name="featured" value="false" />
                  <Button type="submit" variant="ghost" size="sm" disabled={removing} className="text-red-600 hover:text-red-700">
                    <StarOff className="size-4" /> Remove
                  </Button>
                </form>
              </div>
            </div>
          ))}
          {featured.length === 0 && (
            <p className="px-5 py-12 text-center text-sm text-ink-500">No featured ads yet. Add one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
