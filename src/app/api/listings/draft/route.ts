import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sellerDisplayName, uniqueListingSlug } from "@/lib/listings";
import { validateTaxonomyValues } from "@/lib/taxonomy";
import { listingUpdateSchema } from "@/lib/validation";

const createSchema = z.object({
  categoryId: z.string().min(1),
  makeId: z.string().optional(),
  modelId: z.string().optional(),
  variantId: z.string().optional(),
});

export async function POST(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return NextResponse.json({ error: "Verify your phone number to start posting." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Select a vehicle category." }, { status: 400 });

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } });
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  const year = new Date().getFullYear();
  const listing = await prisma.listing.create({
    data: {
      slug: await uniqueListingSlug("untitled-listing"),
      title: "Untitled listing",
      description: "Add a description to help buyers understand this vehicle.",
      price: 1000,
      sellerName: sellerDisplayName(actor.user),
      sellerPhone: actor.user.phone ?? "",
      status: "DRAFT",
      user: { connect: { id: actor.user.id } },
      city: actor.user.profile?.cityId ? { connect: { id: actor.user.profile.cityId } } : undefined,
      vehicle: {
        create: {
          category: { connect: { id: category.id } },
          make: parsed.data.makeId ? { connect: { id: parsed.data.makeId } } : undefined,
          model: parsed.data.modelId ? { connect: { id: parsed.data.modelId } } : undefined,
          variant: parsed.data.variantId ? { connect: { id: parsed.data.variantId } } : undefined,
          year,
          mileageKm: 0,
        },
      },
    },
    include: { vehicle: true, images: true },
  });

  return NextResponse.json({ id: listing.id, slug: listing.slug }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getSessionActor();
  if (!actor) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = listingUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });

  if (!parsed.data.id) return NextResponse.json({ error: "Listing id is required" }, { status: 400 });
  const existing = await prisma.listing.findFirst({
    where: { id: parsed.data.id, userId: actor.user.id, deletedAt: null },
    include: { vehicle: true },
  });
  if (!existing) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  const data = parsed.data;
  const taxonomyCheck = await validateTaxonomyValues({
    bodyType: data.bodyType || undefined,
    fuelType: data.fuelType || undefined,
    transmission: data.transmission || undefined,
    assemblyType: data.assemblyType || undefined,
    condition: data.condition || undefined,
    features: data.features,
  });
  if (!taxonomyCheck.valid) {
    return NextResponse.json(
      { error: `“${taxonomyCheck.value}” is no longer an available ${taxonomyCheck.group.toLowerCase()} option.` },
      { status: 400 },
    );
  }

  const listingData: Record<string, unknown> = {};
  const vehicleData: Record<string, unknown> = {};

  for (const key of ["title", "description", "price", "negotiable", "sellerName", "sellerPhone", "whatsappNumber", "showPhone"] as const) {
    if (data[key] !== undefined) listingData[key] = data[key];
  }
  for (const key of ["cityId", "areaId", "registrationCityId"] as const) {
    if (data[key] !== undefined) listingData[key] = data[key] || null;
  }
  for (const key of ["categoryId", "makeId", "modelId", "variantId"] as const) {
    if (data[key] !== undefined) vehicleData[key] = data[key] || null;
  }
  for (const key of ["year", "mileageKm", "engineCc"] as const) {
    if (data[key] !== undefined) vehicleData[key] = data[key];
  }
  for (const key of ["transmission", "fuelType", "bodyType", "assemblyType", "condition"] as const) {
    if (data[key] !== undefined) vehicleData[key] = data[key] || null;
  }
  if (data.exteriorColor !== undefined) vehicleData.exteriorColor = data.exteriorColor || null;
  if (data.features !== undefined) vehicleData.features = data.features;

  await prisma.$transaction([
    prisma.listing.update({ where: { id: existing.id }, data: listingData }),
    prisma.vehicle.update({ where: { id: existing.vehicleId }, data: vehicleData }),
  ]);

  return NextResponse.json({ ok: true });
}
