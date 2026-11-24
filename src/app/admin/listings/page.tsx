import type { Metadata } from "next";
import Link from "next/link";
import { CarFront, Search } from "lucide-react";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { getAutoApproveEnabled } from "@/lib/customizer/server";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutoApproveToggle } from "@/components/admin/auto-approve-toggle";
import { ModerationControls } from "@/components/admin/moderation-controls";
import { STATUS_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Moderate listings", robots: { index: false, follow: false } };

const PAGE_SIZE = 15;
const STATUSES = ["PENDING", "ACTIVE", "REJECTED", "DRAFT", "EXPIRED", "SOLD"] as const;

type ListingsSearch = { status?: string; q?: string; page?: string };

function pageHref(search: ListingsSearch, page: number) {
  const params = new URLSearchParams();
  if (search.status) params.set("status", search.status);
  if (search.q) params.set("q", search.q);
  params.set("page", String(page));
  return `/admin/listings?${params.toString()}`;
}

export default async function AdminListingsPage({ searchParams }: { searchParams: Promise<ListingsSearch> }) {
  const raw = await searchParams;
  const q = raw.q?.trim() ?? "";
  const status = STATUSES.find((item) => item === raw.status);
  const page = Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1);

  const user = await getSessionUser();
  const canModerate = hasPermission(user, "listing.moderate");
  const canPromote = hasPermission(user, "listing.promote");

  const where = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { sellerName: { contains: q, mode: "insensitive" as const } },
            { vehicle: { make: { name: { contains: q, mode: "insensitive" as const } } } },
            { vehicle: { model: { name: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const [listings, total, counts, autoApprove] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        vehicle: { include: { make: true, model: true } },
        images: { orderBy: { position: "asc" }, take: 1 },
        city: true,
        user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.listing.count({ where }),
    prisma.listing.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
    getAutoApproveEnabled(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const countMap = new Map(counts.map((item) => [item.status, item._count._all]));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Listing moderation</h1>
          <p className="mt-1 text-sm text-ink-500">Review, approve and promote ads across the marketplace.</p>
        </div>
      </div>

      <AutoApproveToggle enabled={autoApprove} canManage={hasPermission(user, "settings.manage")} />

      <div className="surface-card mt-6 rounded-xl p-4">
        <form className="flex flex-col gap-3 sm:flex-row" method="get">
          <label className="relative flex-1">
            <span className="sr-only">Search listings</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <Input name="q" defaultValue={q} placeholder="Search by title, seller, make or model" className="pl-9" />
          </label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm font-semibold text-ink-800 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
          >
            <option value="">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>{STATUS_LABELS[item]} ({countMap.get(item) ?? 0})</option>
            ))}
          </select>
          <Button type="submit">Apply</Button>
        </form>
      </div>

      <div className="mt-6 space-y-3">
        {listings.length === 0 ? (
          <div className="surface-card rounded-xl px-6 py-20 text-center">
            <CarFront className="mx-auto size-10 text-ink-300" />
            <p className="mt-3 font-bold">No listings match these filters.</p>
          </div>
        ) : (
          listings.map((listing) => {
            const seller = [listing.user.profile?.firstName, listing.user.profile?.lastName].filter(Boolean).join(" ") || listing.user.email;
            return (
              <article key={listing.id} className="surface-card rounded-xl p-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-100">
                    {listing.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.images[0].url} alt="" className="size-full object-cover" />
                    ) : (
                      <CarFront className="size-8 text-ink-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/listings/${listing.slug}`} className="font-display text-lg font-bold hover:text-link">
                        {listing.title}
                      </Link>
                      <Badge
                        variant={listing.status === "ACTIVE" ? "success" : listing.status === "REJECTED" ? "danger" : "signal"}
                      >
                        {STATUS_LABELS[listing.status] ?? listing.status}
                      </Badge>
                      {listing.isFeatured && <Badge variant="signal">Featured</Badge>}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-cta-ink dark:text-cta">{formatPrice(listing.price)}</p>
                    <p className="mt-1 text-xs text-ink-500">
                      {[listing.vehicle.make?.name, listing.vehicle.model?.name, listing.vehicle.year].filter(Boolean).join(" · ")}
                      {" · "}{listing.city?.name ?? "Location not set"} · Seller: {seller}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-600 dark:text-ink-300">{listing.description}</p>
                    {listing.rejectionReason && (
                      <p className="mt-2 text-xs font-semibold text-red-600">Rejection reason: {listing.rejectionReason}</p>
                    )}
                    <div className="mt-3">
                      <ModerationControls
                        listingId={listing.id}
                        status={listing.status}
                        isFeatured={listing.isFeatured}
                        canModerate={canModerate}
                        canPromote={canPromote}
                        canEdit={canModerate}
                        canDelete={canModerate}
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
            <Link
              key={item}
              href={pageHref(raw, item)}
              className={`flex size-9 items-center justify-center rounded-lg text-sm font-bold ${
                item === page ? "bg-link-ink text-white" : "surface-card text-ink-600 hover:text-link"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
