import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  FeaturedManager,
  type FeaturedOption,
} from "@/components/admin/featured-manager";

export const metadata: Metadata = {
  title: "Featured ads — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminFeaturedPage() {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "listing.promote")) redirect("/admin");

  const [featuredRows, availableRows] = await Promise.all([
    prisma.listing.findMany({
      where: { deletedAt: null, status: "ACTIVE", isFeatured: true },
      include: { images: { orderBy: { isPrimary: "desc" }, take: 1 } },
      orderBy: [{ featuredRank: "desc" }, { publishedAt: "desc" }],
      take: 60,
    }),
    prisma.listing.findMany({
      where: { deletedAt: null, status: "ACTIVE", isFeatured: false },
      include: { images: { orderBy: { isPrimary: "desc" }, take: 1 } },
      orderBy: { publishedAt: "desc" },
      take: 100,
    }),
  ]);

  const toOption = (listing: (typeof featuredRows)[number]): FeaturedOption => ({
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    price: listing.price,
    image: listing.images[0]?.url ?? "",
    rank: listing.featuredRank,
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Featured ads</h1>
      <p className="mt-1 text-sm text-ink-500">
        Add new promotions, remove old ones and control their homepage order.
      </p>
      <div className="mt-6">
        <FeaturedManager
          featured={featuredRows.map(toOption)}
          available={availableRows.map(toOption)}
        />
      </div>
    </div>
  );
}
