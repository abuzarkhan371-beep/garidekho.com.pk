import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin, Phone, Star, Store } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Verified dealers in Pakistan",
  description: "Browse verified car and bike dealers with active listings across Pakistan.",
  alternates: { canonical: "/dealers" },
};

export default async function DealersPage() {
  const dealers = await prisma.dealer.findMany({
    where: { verificationStatus: "VERIFIED", isActive: true },
    include: {
      city: { select: { name: true } },
      province: { select: { name: true } },
      listings: {
        where: { status: "ACTIVE", deletedAt: null },
        select: { id: true },
      },
    },
    orderBy: [{ ratingAvg: "desc" }, { businessName: "asc" }],
    take: 24,
  });

  return (
    <div className="container-gdk py-8 lg:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-link">Trusted partners</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Verified dealers</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-500">
        Businesses whose identity and inventory have been reviewed by our team. Every dealer below has an active presence on Garidekho.
      </p>

      {dealers.length === 0 ? (
        <div className="surface-card mt-8 rounded-xl px-6 py-20 text-center">
          <Store className="mx-auto size-12 text-ink-300" />
          <h2 className="mt-4 font-display text-xl font-bold">No verified dealers yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            We are still reviewing dealer applications. In the meantime, browse thousands of listings from private sellers.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild><Link href="/search">Browse vehicles</Link></Button>
            <Button asChild variant="outline"><Link href="/contact">Become a dealer</Link></Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm font-semibold text-ink-500">{dealers.length} verified {dealers.length === 1 ? "dealer" : "dealers"}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dealers.map((dealer) => (
              <Link
                key={dealer.id}
                href={`/dealers/${dealer.slug}`}
                className="surface-card flex min-h-48 flex-col rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:border-link"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink-50 font-display text-lg font-extrabold text-link">
                    {dealer.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={dealer.logoUrl}
                        alt=""
                        className="size-full object-cover"
                        loading="eager"
                        fetchPriority="high"
                      />
                    ) : (
                      dealer.businessName.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-display text-lg font-bold leading-tight">
                      <span className="truncate">{dealer.businessName}</span>
                      <BadgeCheck className="size-4 shrink-0 text-link" aria-label="Verified dealer" />
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{[dealer.city?.name, dealer.province?.name].filter(Boolean).join(", ") || "Pakistan"}</span>
                    </p>
                  </div>
                </div>

                {dealer.description && (
                  <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-500">{dealer.description}</p>
                )}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 text-xs">
                  <span className="font-bold text-ink-900">
                    {dealer.listings.length} active {dealer.listings.length === 1 ? "ad" : "ads"}
                  </span>
                  <span className="flex items-center gap-1 text-ink-500">
                    <Star className="size-3.5 text-cta" /> {dealer.ratingAvg.toFixed(1)} ({dealer.ratingCount})
                  </span>
                </div>
                <span className="mt-3 flex min-h-10 items-center gap-1.5 text-sm font-bold text-link">
                  <Phone className="size-4" /> {dealer.phone}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="surface-card mt-10 rounded-xl p-6 text-center">
        <h2 className="font-display text-lg font-bold">Want to list your dealership?</h2>
        <p className="mt-1 text-sm text-ink-500">Talk to our team about verification and dealer plans.</p>
        <Button asChild variant="outline" className="mt-4"><Link href="/contact">Contact sales</Link></Button>
      </div>
    </div>
  );
}
