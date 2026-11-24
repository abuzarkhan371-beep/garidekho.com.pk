import "server-only";
import slugify from "slugify";
import { prisma } from "@/lib/db";
import { getSessionActor, type SessionUser } from "@/lib/auth";

export async function uniqueListingSlug(title: string, excludeId?: string) {
  const base = slugify(title, { lower: true, strict: true, trim: true }).slice(0, 72) || "vehicle";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt}`;
    const candidate = `${base}${suffix}`;
    const existing = await prisma.listing.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function sellerDisplayName(user: SessionUser) {
  const profile = user.profile;
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  return name || user.email.split("@")[0] || "Seller";
}

export async function requireOwnedListing(listingId: string) {
  const actor = await getSessionActor();
  if (!actor) return null;
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, deletedAt: null, userId: actor.user.id },
    include: { vehicle: true, images: { orderBy: { position: "asc" } } },
  });
  if (!listing) return null;
  return { listing, ...actor };
}
