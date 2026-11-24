import { NextResponse } from "next/server";
import { MAX_LISTING_IMAGES } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { requireOwnedListing } from "@/lib/listings";
import { deleteStoredImage, storeImage } from "@/lib/services/storage";
import { z } from "zod";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const owned = await requireOwnedListing(id);
  if (!owned) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const formData = await request.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length === 0) return NextResponse.json({ error: "Choose at least one photo." }, { status: 400 });
  if (owned.listing.images.length + files.length > MAX_LISTING_IMAGES) {
    return NextResponse.json({ error: `Maximum ${MAX_LISTING_IMAGES} photos are allowed.` }, { status: 400 });
  }

  const created: { id: string; url: string; position: number; publicId: string }[] = [];
  for (const [index, file] of files.entries()) {
    try {
      const stored = await storeImage(file, owned.user.id);
      const image = await prisma.vehicleImage.create({
        data: {
          listingId: id,
          url: stored.url,
          publicId: stored.publicId,
          width: stored.width,
          height: stored.height,
          sizeBytes: stored.sizeBytes,
          position: owned.listing.images.length + index,
          isPrimary: owned.listing.images.length === 0 && index === 0,
          alt: `${owned.listing.title} photo ${owned.listing.images.length + index + 1}`,
        },
      });
      created.push({ id: image.id, url: image.url, position: image.position, publicId: image.publicId ?? "" });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Could not process one of the photos." },
        { status: 400 },
      );
    }
  }

  return NextResponse.json({ images: created }, { status: 201 });
}

const reorderSchema = z.object({ ids: z.array(z.string()).min(1).max(MAX_LISTING_IMAGES) });

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  const owned = await requireOwnedListing(id);
  if (!owned) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const parsed = reorderSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid image order" }, { status: 400 });

  const existingIds = owned.listing.images.map((image) => image.id);
  if (parsed.data.ids.length !== existingIds.length || parsed.data.ids.some((imageId) => !existingIds.includes(imageId))) {
    return NextResponse.json({ error: "Image list does not match this listing." }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.ids.map((imageId, index) =>
      prisma.vehicleImage.update({
        where: { id: imageId },
        data: { position: index, isPrimary: index === 0 },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Context) {
  const { id } = await params;
  const owned = await requireOwnedListing(id);
  if (!owned) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const publicId = new URL(request.url).searchParams.get("publicId");
  if (!publicId) return NextResponse.json({ error: "publicId is required" }, { status: 400 });
  const image = owned.listing.images.find((item) => item.publicId === publicId);
  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  await prisma.vehicleImage.delete({ where: { id: image.id } });
  await deleteStoredImage(publicId, owned.listing.userId);
  await prisma.$transaction(
    owned.listing.images
      .filter((item) => item.id !== image.id)
      .map((item, index) =>
        prisma.vehicleImage.update({
          where: { id: item.id },
          data: { position: index, isPrimary: index === 0 },
        }),
      ),
  );

  return NextResponse.json({ ok: true });
}
