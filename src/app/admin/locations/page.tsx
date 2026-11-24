import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CatalogManager, type CatalogField, type CatalogRow } from "@/components/admin/catalog-manager";

export const metadata: Metadata = { title: "Locations", robots: { index: false, follow: false } };

export default async function AdminLocationsPage() {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "location.manage")) redirect("/admin");

  const [provinces, cities, areas] = await Promise.all([
    prisma.province.findMany({
      select: { id: true, name: true, slug: true, code: true, capital: true },
      orderBy: { name: "asc" },
    }),
    prisma.city.findMany({
      select: {
        id: true, provinceId: true, name: true, slug: true, latitude: true,
        longitude: true, isMajor: true, imageUrl: true, description: true,
        province: { select: { name: true } },
      },
      orderBy: [{ isMajor: "desc" }, { name: "asc" }],
    }),
    prisma.area.findMany({
      select: { id: true, cityId: true, name: true, slug: true, city: { select: { name: true } } },
      orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  const provinceOptions = provinces.map((province) => ({ value: province.id, label: province.name }));
  const cityOptions = cities.map((city) => ({ value: city.id, label: city.name }));

  const provinceFields: CatalogField[] = [
    { name: "name", label: "Province name", required: true },
    { name: "slug", label: "URL slug", placeholder: "Auto-generated from name" },
    { name: "code", label: "Short code", required: true, placeholder: "PB, SD, KP…" },
    { name: "capital", label: "Capital" },
  ];

  const cityFields: CatalogField[] = [
    { name: "provinceId", label: "Province", type: "select", required: true, options: provinceOptions },
    { name: "name", label: "City name", required: true },
    { name: "slug", label: "URL slug", placeholder: "Auto-generated from name" },
    { name: "latitude", label: "Latitude", type: "number" },
    { name: "longitude", label: "Longitude", type: "number" },
    { name: "imageUrl", label: "Image URL" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "isMajor", label: "Major city (homepage + hero search)", type: "checkbox" },
  ];

  const areaFields: CatalogField[] = [
    { name: "cityId", label: "City", type: "select", required: true, options: cityOptions },
    { name: "name", label: "Area name", required: true },
    { name: "slug", label: "URL slug", placeholder: "Auto-generated from name" },
  ];

  const cityRows: CatalogRow[] = cities.map((city) => ({ ...city, provinceName: city.province.name }));
  const areaRows: CatalogRow[] = areas.map((area) => ({ ...area, cityName: area.city.name }));

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Locations</h1>
      <p className="mt-1 text-sm text-ink-500">
        Manage the full Pakistan location hierarchy used by ads, filters, dealer profiles and city pages.
      </p>
      <CatalogManager
        kind="province"
        title="Provinces & territories"
        description="Top level of the location tree."
        fields={provinceFields}
        columns={[
          { key: "name", label: "Province" },
          { key: "code", label: "Code" },
          { key: "slug", label: "Slug" },
          { key: "capital", label: "Capital" },
        ]}
        rows={provinces as CatalogRow[]}
      />
      <CatalogManager
        kind="city"
        title="Cities"
        description="Major cities appear in the homepage hero and city navigation."
        fields={cityFields}
        columns={[
          { key: "name", label: "City" },
          { key: "provinceId", label: "Province" },
          { key: "slug", label: "Slug" },
          { key: "isMajor", label: "Major" },
        ]}
        rows={cityRows}
      />
      <CatalogManager
        kind="area"
        title="Areas / neighbourhoods"
        description="Optional local detail shown in the location step of the sell wizard."
        fields={areaFields}
        columns={[
          { key: "name", label: "Area" },
          { key: "cityId", label: "City" },
          { key: "slug", label: "Slug" },
        ]}
        rows={areaRows}
      />
    </div>
  );
}
