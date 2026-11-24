import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAutoApproveEnabled } from "@/lib/customizer/server";
import { prisma } from "@/lib/db";
import { requireOwnedListing, uniqueListingSlug } from "@/lib/listings";
import { validateTaxonomyValues } from "@/lib/taxonomy";
import { firstError, listingDraftSchema } from "@/lib/validation";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await requireOwnedListing(id);
  if (!owned) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const { listing, user, isGuest } = owned;
  if (isGuest && (!user.phone || !user.profile?.phoneVerifiedAt)) {
    return NextResponse.json({ error: "Verify your phone number before publishing." }, { status: 403 });
  }

  const parsed = listingDraftSchema.safeParse({
    id: listing.id,
    categoryId: listing.vehicle.categoryId,
    makeId: listing.vehicle.makeId ?? undefined,
    modelId: listing.vehicle.modelId ?? undefined,
    variantId: listing.vehicle.variantId ?? undefined,
    year: listing.vehicle.year,
    mileageKm: listing.vehicle.mileageKm,
    engineCc: listing.vehicle.engineCc ?? undefined,
    transmission: listing.vehicle.transmission ?? undefined,
    fuelType: listing.vehicle.fuelType ?? undefined,
    bodyType: listing.vehicle.bodyType ?? undefined,
    exteriorColor: listing.vehicle.exteriorColor ?? undefined,
    assemblyType: listing.vehicle.assemblyType ?? undefined,
    condition: listing.vehicle.condition ?? undefined,
    features: listing.vehicle.features,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    negotiable: listing.negotiable,
    cityId: listing.cityId ?? undefined,
    areaId: listing.areaId ?? undefined,
    registrationCityId: listing.registrationCityId ?? undefined,
    sellerName: listing.sellerName,
    sellerPhone: listing.sellerPhone,
    whatsappNumber: listing.whatsappNumber ?? undefined,
    imageIds: listing.images.map((image) => image.id),
  });

  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });

  const taxonomyCheck = await validateTaxonomyValues(parsed.data);
  if (!taxonomyCheck.valid) {
    return NextResponse.json(
      { error: `“${taxonomyCheck.value}” is no longer an available ${taxonomyCheck.group.toLowerCase()} option.` },
      { status: 400 },
    );
  }

  const slug = await uniqueListingSlug(listing.title, listing.id);
  const autoApprove = await getAutoApproveEnabled();
  const status = autoApprove ? "ACTIVE" : "PENDING";
  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: {
      slug,
      status,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      rejectionReason: null,
      moderationNote: autoApprove ? "Auto-approved on publish" : null,
    },
    select: { id: true, slug: true, status: true },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      listingId: listing.id,
      type: "LISTING_APPROVED",
      title: autoApprove ? "Your ad is live" : "Your ad was submitted",
      body: autoApprove
        ? `“${listing.title}” is now live on Garidekho. Buyers can find it straight away.`
        : "Thanks for posting on Garidekho. Our moderation team will review it shortly and notify you once it is live.",
      href: `/listings/${slug}`,
    },
  });

  if (autoApprove) {
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/my-ads");
    revalidatePath(`/listings/${slug}`);
  }

  return NextResponse.json(updated);
}
