import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTaxonomyOptions, optionsForGroup, optionsToChoices } from "@/lib/taxonomy";
import { ListingEditForm, type EditableListing } from "@/components/admin/listing-edit-form";

export const metadata: Metadata = { title: "Edit listing", robots: { index: false, follow: false } };

export default async function AdminEditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, admin] = await Promise.all([params, getSessionUser()]);
  if (!admin || !hasPermission(admin, "listing.moderate")) redirect("/admin");

  const [listing, cities, taxonomy] = await Promise.all([
    prisma.listing.findUnique({
      where: { id },
      include: { vehicle: true },
    }),
    prisma.city.findMany({
      where: { isMajor: true },
      select: { id: true, name: true, areas: { select: { id: true, name: true }, orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    }),
    getTaxonomyOptions(),
  ]);
  if (!listing || listing.deletedAt) notFound();

  const editable: EditableListing = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    status: listing.status,
    negotiable: listing.negotiable,
    cityId: listing.cityId,
    areaId: listing.areaId,
    sellerName: listing.sellerName,
    sellerPhone: listing.sellerPhone,
    vehicle: {
      year: listing.vehicle.year,
      mileageKm: listing.vehicle.mileageKm,
      transmission: listing.vehicle.transmission,
      fuelType: listing.vehicle.fuelType,
      bodyType: listing.vehicle.bodyType,
      assemblyType: listing.vehicle.assemblyType,
      condition: listing.vehicle.condition,
    },
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold">Edit listing</h1>
        <p className="mt-1 text-sm text-ink-500">Corrections are saved to the live ad and the seller is notified.</p>
      </div>
      <ListingEditForm
        listing={editable}
        cities={cities}
        options={{
          bodyTypes: optionsToChoices(optionsForGroup(taxonomy, "BODY_TYPE")),
          fuelTypes: optionsToChoices(optionsForGroup(taxonomy, "FUEL_TYPE")),
          transmissions: optionsToChoices(optionsForGroup(taxonomy, "TRANSMISSION")),
          assemblyTypes: optionsToChoices(optionsForGroup(taxonomy, "ASSEMBLY_TYPE")),
          conditions: optionsToChoices(optionsForGroup(taxonomy, "CONDITION")),
        }}
      />
    </div>
  );
}
