import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CatalogManager, type CatalogField, type CatalogRow } from "@/components/admin/catalog-manager";

export const metadata: Metadata = { title: "Brands & models", robots: { index: false, follow: false } };

export default async function AdminBrandsPage() {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "taxonomy.manage")) redirect("/admin");

  const [makes, models] = await Promise.all([
    prisma.vehicleMake.findMany({
      select: {
        id: true, name: true, slug: true, logoUrl: true, country: true,
        description: true, isPopular: true, isActive: true,
      },
      orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    }),
    prisma.vehicleModel.findMany({
      select: {
        id: true, makeId: true, name: true, slug: true, yearFrom: true, yearTo: true,
        description: true, isActive: true, make: { select: { name: true } },
      },
      orderBy: [{ make: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  const makeOptions = makes.map((make) => ({ value: make.id, label: make.name }));
  const makeFields: CatalogField[] = [
    { name: "name", label: "Brand name", required: true },
    { name: "slug", label: "URL slug", placeholder: "Auto-generated from name" },
    { name: "country", label: "Country of origin" },
    { name: "logoUrl", label: "Logo URL", placeholder: "https://… or /api/uploads/…" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "isPopular", label: "Show as popular", type: "checkbox" },
    { name: "isActive", label: "Active", type: "checkbox" },
  ];

  const modelFields: CatalogField[] = [
    { name: "makeId", label: "Brand", type: "select", required: true, options: makeOptions },
    { name: "name", label: "Model name", required: true },
    { name: "slug", label: "URL slug", placeholder: "Auto-generated from name" },
    { name: "yearFrom", label: "First model year", type: "number" },
    { name: "yearTo", label: "Last model year", type: "number" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "isActive", label: "Active", type: "checkbox" },
  ];

  const modelRows: CatalogRow[] = models.map((model) => ({
    ...model,
    years: model.yearFrom || model.yearTo ? `${model.yearFrom ?? "?"}–${model.yearTo ?? "now"}` : "—",
  }));

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Brands &amp; models</h1>
      <p className="mt-1 text-sm text-ink-500">
        New brands, models and their URL slugs flow straight into the sell wizard, search and brand pages.
      </p>
      <CatalogManager
        kind="make"
        title="Vehicle brands"
        description="Popular brands get extra visibility on the homepage and search filters."
        fields={makeFields}
        columns={[
          { key: "name", label: "Brand" },
          { key: "slug", label: "Slug" },
          { key: "country", label: "Country" },
          { key: "isPopular", label: "Popular" },
          { key: "isActive", label: "Status" },
        ]}
        rows={makes as CatalogRow[]}
      />
      <CatalogManager
        kind="model"
        title="Vehicle models"
        description="Models belong to a brand. Deactivate rather than delete when listings exist."
        fields={modelFields}
        columns={[
          { key: "name", label: "Model" },
          { key: "makeId", label: "Brand" },
          { key: "slug", label: "Slug" },
          { key: "years", label: "Years" },
          { key: "isActive", label: "Status" },
        ]}
        rows={modelRows}
      />
    </div>
  );
}
