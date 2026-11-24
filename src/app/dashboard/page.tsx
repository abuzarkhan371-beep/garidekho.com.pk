import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CarFront, Heart, MessagesSquare, Plus, Settings, Store } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STATUS_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");

  const conversationWhere = { OR: [{ buyerId: user.id }, { sellerId: user.id }] };

  const [totalListings, activeListings, savedCount, conversationCount, unreadMessages, recentListings] = await Promise.all([
    prisma.listing.count({ where: { userId: user.id, deletedAt: null } }),
    prisma.listing.count({ where: { userId: user.id, deletedAt: null, status: "ACTIVE" } }),
    prisma.favourite.count({ where: { userId: user.id } }),
    prisma.conversation.count({ where: conversationWhere }),
    prisma.message.count({
      where: { isRead: false, senderId: { not: user.id }, conversation: conversationWhere },
    }),
    prisma.listing.findMany({
      where: { userId: user.id, deletedAt: null },
      include: { city: true, images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
  ]);

  const displayName =
    [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || user.email.split("@")[0];

  const quickLinks = [
    { label: "My listings", href: "/my-ads", icon: CarFront, value: totalListings, hint: `${activeListings} active` },
    { label: "Saved vehicles", href: "/saved", icon: Heart, value: savedCount, hint: "Watchlist" },
    {
      label: "Messages",
      href: "/messages",
      icon: MessagesSquare,
      value: conversationCount,
      hint: unreadMessages > 0 ? `${unreadMessages} unread` : "Inbox",
    },
    { label: "Account settings", href: "/dashboard/settings", icon: Settings, value: null, hint: "Profile & contact" },
    ...(user.roleName === "DEALER"
      ? [{ label: "Dealer portal", href: "/dealer", icon: Store, value: null, hint: "Business profile" }]
      : []),
  ];

  return (
    <div className="container-gdk py-8 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Your account</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Welcome back, {displayName}</h1>
          <p className="mt-2 text-sm text-ink-500">Manage your ads, saved vehicles and conversations in one place.</p>
        </div>
        <Button asChild>
          <Link href="/sell"><Plus /> Post an ad</Link>
        </Button>
      </div>

      <section aria-label="Account summary" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="surface-card group flex min-h-28 flex-col justify-between rounded-xl p-5 transition-colors hover:border-link hover:text-link"
          >
            <div className="flex items-start justify-between gap-2">
              <item.icon className="size-5 text-link" />
              <ArrowUpRight className="size-4 text-ink-400 transition-colors group-hover:text-link" />
            </div>
            <div className="mt-4">
              <p className="flex items-baseline gap-2">
                {item.value !== null && <span className="font-display text-2xl font-extrabold text-ink-900">{item.value}</span>}
                <span className="text-sm font-bold text-ink-900 group-hover:text-link">{item.label}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-500">{item.hint}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-10" aria-labelledby="recent-listings-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="recent-listings-title" className="font-display text-xl font-extrabold sm:text-2xl">Recent listings</h2>
            <p className="mt-1 text-sm text-ink-500">The last three ads you updated.</p>
          </div>
          <Link href="/my-ads" className="flex min-h-10 items-center gap-1 text-sm font-bold text-link hover:underline">
            View all <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {recentListings.length === 0 ? (
          <div className="surface-card mt-5 rounded-xl px-6 py-16 text-center">
            <CarFront className="mx-auto size-11 text-ink-300" />
            <h3 className="mt-4 font-display text-lg font-bold">No ads yet</h3>
            <p className="mt-1 text-sm text-ink-500">List your first vehicle and it will appear here.</p>
            <Button asChild className="mt-5"><Link href="/sell">Post an ad</Link></Button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {recentListings.map((listing) => (
              <div key={listing.id} className="surface-card flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-50">
                  {listing.images[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={listing.images[0].url} alt="" className="size-full object-cover" loading="eager" fetchPriority="high" />
                  ) : (
                    <CarFront className="size-7 text-ink-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/listings/${listing.slug}`} className="truncate font-bold hover:text-link">{listing.title}</Link>
                    <Badge variant={listing.status === "ACTIVE" ? "success" : "neutral"}>
                      {STATUS_LABELS[listing.status] ?? listing.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm font-bold text-cta-ink">{formatPrice(listing.price)}</p>
                  <p className="mt-0.5 text-xs text-ink-500">{listing.city?.name ?? "Location not set"}</p>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/listings/${listing.slug}`}>View ad</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
