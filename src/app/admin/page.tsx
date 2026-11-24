import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CarFront, Clock3, Star, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const [users, active, pending, featured, recent] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.listing.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    prisma.listing.count({ where: { deletedAt: null, status: "PENDING" } }),
    prisma.listing.count({ where: { deletedAt: null, status: "ACTIVE", isFeatured: true } }),
    prisma.listing.findMany({
      where: { status: "PENDING", deletedAt: null },
      include: {
        vehicle: { include: { make: true, model: true } },
        images: { orderBy: { position: "asc" }, take: 1 },
        city: true,
        user: { select: { profile: { select: { firstName: true, lastName: true } }, email: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
  ]);

  const stats = [
    { label: "Total Users", value: users, icon: Users, tone: "text-link" },
    { label: "Active Ads", value: active, icon: CarFront, tone: "text-emerald-600" },
    { label: "Pending Ads", value: pending, icon: Clock3, tone: "text-signal-600" },
    { label: "Featured Ads", value: featured, icon: Star, tone: "text-amber-600" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Admin overview</h1>
          <p className="mt-1 text-sm text-ink-500">Marketplace health and moderation queue at a glance.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/listings">Open moderation queue <ArrowRight /></Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="surface-card rounded-xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
              <Icon className={`size-5 ${tone}`} />
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold">{value.toLocaleString("en-PK")}</p>
          </div>
        ))}
      </div>

      <div className="surface-card mt-6 overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <div>
            <h2 className="font-display text-lg font-bold">Oldest listings awaiting review</h2>
            <p className="text-xs text-ink-500">Approve accurate listings or reject them with a clear reason.</p>
          </div>
          <Link href="/admin/listings" className="text-sm font-semibold text-link hover:underline dark:text-link-soft">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-ink-500">The moderation queue is clear.</div>
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {recent.map((listing) => {
              const seller = [listing.user.profile?.firstName, listing.user.profile?.lastName].filter(Boolean).join(" ") || listing.user.email;
              return (
                <div key={listing.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-100">
                    {listing.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.images[0].url} alt="" className="size-full object-cover" />
                    ) : (
                      <CarFront className="size-6 text-ink-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/listings/${listing.slug}`} className="truncate font-bold hover:text-link">
                        {listing.title}
                      </Link>
                      <Badge variant="signal">{STATUS_LABELS[listing.status]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      {formatPrice(listing.price)} · {listing.city?.name ?? "Location not set"} · {seller}
                    </p>
                  </div>
                  <Link
                    href={`/admin/listings?status=PENDING&q=${encodeURIComponent(listing.title)}`}
                    className="text-sm font-semibold text-link hover:underline dark:text-link-soft"
                  >
                    Review →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
