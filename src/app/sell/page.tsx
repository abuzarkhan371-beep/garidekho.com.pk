import type { Metadata } from "next";
import { getSessionActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SellWizard, type WizardData, type WizardSnapshot } from "@/components/sell/sell-wizard";
import { GuestGate } from "@/components/sell/guest-gate";
import { getTaxonomyOptions, optionsForGroup, optionsToChoices } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "Post an ad — sell your car, bike or auto parts in Pakistan",
  description: "List your vehicle on Garidekho in eight guided steps. Add up to 20 photos, set your price and publish without creating an account.",
};

export default async function SellPage() {
  const [actor, categories, makes, cities, taxonomy] = await Promise.all([
    getSessionActor(),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.vehicleMake.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        models: {
          where: { isActive: true },
          select: {
            id: true, name: true,
            variants: {
              where: { isActive: true },
              select: { id: true, name: true, engineCc: true, transmission: true, fuelType: true },
              orderBy: { name: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    }),
    prisma.city.findMany({
      select: { id: true, name: true, areas: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    getTaxonomyOptions(),
  ]);

  const data: WizardData = {
    categories,
    makes,
    cities,
    features: optionsForGroup(taxonomy, "FEATURE").map((option) => option.label),
    options: {
      bodyTypes: optionsToChoices(optionsForGroup(taxonomy, "BODY_TYPE")),
      fuelTypes: optionsToChoices(optionsForGroup(taxonomy, "FUEL_TYPE")),
      transmissions: optionsToChoices(optionsForGroup(taxonomy, "TRANSMISSION")),
      assemblyTypes: optionsToChoices(optionsForGroup(taxonomy, "ASSEMBLY_TYPE")),
      conditions: optionsToChoices(optionsForGroup(taxonomy, "CONDITION")),
    },
  };

  if (!actor) {
    return <GuestGate data={data} />;
  }

  const draft = await prisma.listing.findFirst({
    where: { userId: actor.user.id, status: "DRAFT", deletedAt: null },
    include: { vehicle: true, images: { orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  const initialDraft: WizardSnapshot | null = draft
    ? {
        id: draft.id,
        categoryId: draft.vehicle.categoryId,
        makeId: draft.vehicle.makeId ?? "",
        modelId: draft.vehicle.modelId ?? "",
        variantId: draft.vehicle.variantId ?? "",
        year: draft.vehicle.year,
        mileageKm: draft.vehicle.mileageKm,
        engineCc: draft.vehicle.engineCc ?? 0,
        transmission: draft.vehicle.transmission ?? "",
        fuelType: draft.vehicle.fuelType ?? "",
        bodyType: draft.vehicle.bodyType ?? "",
        exteriorColor: draft.vehicle.exteriorColor ?? "",
        assemblyType: draft.vehicle.assemblyType ?? "",
        condition: draft.vehicle.condition ?? "",
        features: draft.vehicle.features,
        title: draft.title,
        description: draft.description,
        price: draft.price,
        negotiable: draft.negotiable,
        cityId: draft.cityId ?? "",
        areaId: draft.areaId ?? "",
        registrationCityId: draft.registrationCityId ?? "",
        sellerName: draft.sellerName,
        sellerPhone: draft.sellerPhone,
        whatsappNumber: draft.whatsappNumber ?? "",
        showPhone: draft.showPhone,
        images: draft.images.map((image) => ({
          id: image.id, url: image.url, position: image.position, publicId: image.publicId ?? "",
        })),
      }
    : null;

  return (
    <SellWizard
      data={data}
      initialDraft={initialDraft}
      isGuest={actor.isGuest}
      defaultSellerName={[actor.user.profile?.firstName, actor.user.profile?.lastName].filter(Boolean).join(" ") || actor.user.email.split("@")[0]}
      defaultSellerPhone={actor.user.phone ?? ""}
      defaultCityId={actor.user.profile?.cityId ?? ""}
    />
  );
}
