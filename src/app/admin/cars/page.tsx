import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseCarSpecs } from "@/lib/data/car-specs";
import { getNewCars } from "@/lib/data/new-cars";
import {
  NewCarManager,
  UsedCarManager,
  type UsedCarOption,
} from "@/components/admin/car-manager";

export const metadata: Metadata = {
  title: "Manage cars — Admin",
  robots: { index: false, follow: false },
};

type Params = Promise<{ type?: string; edit?: string }>;

export default async function AdminCarsPage({ searchParams }: { searchParams: Params }) {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "cms.manage")) redirect("/admin");

  const { type, edit } = await searchParams;
  const mode = type === "used" ? "used" : "new";

  const [cars, listings, categories, makes, models, cities] = await Promise.all([
    getNewCars(),
    prisma.listing.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      include: {
        vehicle: { include: { make: true, model: true } },
        images: { orderBy: { isPrimary: "desc" }, take: 1 },
      },
      orderBy: { publishedAt: "desc" },
      take: 100,
    }),
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.vehicleMake.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.vehicleModel.findMany({ where: { isActive: true }, select: { id: true, name: true, makeId: true }, orderBy: { name: "asc" } }),
    prisma.city.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const usedCars: UsedCarOption[] = listings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    description: listing.description,
    price: listing.price,
    isFeatured: listing.isFeatured,
    isVerified: listing.isVerified,
    image: listing.images[0]?.url ?? "",
    specs: parseCarSpecs(listing.vehicle.specs),
    vehicle: {
      year: listing.vehicle.year,
      mileageKm: listing.vehicle.mileageKm,
      transmission: listing.vehicle.transmission,
      fuelType: listing.vehicle.fuelType,
      bodyType: listing.vehicle.bodyType,
      makeId: listing.vehicle.makeId,
      modelId: listing.vehicle.modelId,
    },
    cityId: listing.cityId,
  }));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Manage cars</h1>
          <p className="mt-1 text-sm text-ink-500">
            Add and edit new or used cars with the full comparison specification sheet.
          </p>
        </div>
        <Link
          href="/admin/featured"
          className="text-sm font-bold text-link hover:underline dark:text-link-soft"
        >
          Manage featured ads →
        </Link>
      </div>

      <div className="mt-6 flex gap-2 border-b border-ink-100 dark:border-ink-800">
        <Link
          href="/admin/cars?type=new"
          className={`inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-bold ${
            mode === "new"
              ? "border-link text-link dark:text-link-soft"
              : "border-transparent text-ink-500 hover:text-ink-900 dark:hover:text-white"
          }`}
        >
          New cars ({cars.length})
        </Link>
        <Link
          href="/admin/cars?type=used"
          className={`inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-bold ${
            mode === "used"
              ? "border-link text-link dark:text-link-soft"
              : "border-transparent text-ink-500 hover:text-ink-900 dark:hover:text-white"
          }`}
        >
          Used cars ({usedCars.length})
        </Link>
      </div>

      <div className="mt-6">
        {mode === "new" ? (
          <NewCarManager cars={cars} />
        ) : (
          <UsedCarManager
            listings={usedCars}
            categories={categories}
            makes={makes}
            models={models}
            cities={cities}
            initialEditId={edit}
          />
        )}
      </div>
    </div>
  );
}
