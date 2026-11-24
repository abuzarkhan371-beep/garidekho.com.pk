import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CatalogManager, type CatalogField, type CatalogRow } from "@/components/admin/catalog-manager";

export const metadata: Metadata = { title: "Categories", robots: { index: false, follow: false } };

export default async function AdminCategoriesPage() {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "category.manage")) redirect("/admin");

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true, description: true, icon: true, parentId: true, sortOrder: true, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const parentOptions = categories.map((category) => ({ value: category.id, label: category.name }));

  const fields: CatalogField[] = [
    { name: "name", label: "Name", required: true },
    { name: "slug", label: "URL slug", placeholder: "Auto-generated from name" },
    { name: "parentId", label: "Parent category", type: "select", options: parentOptions },
    { name: "icon", label: "Icon name", placeholder: "CarFront, Bike, Truck, Wrench…" },
    { name: "sortOrder", label: "Sort order", type: "number" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "isActive", label: "Active (visible on the site)", type: "checkbox" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Categories</h1>
      <p className="mt-1 text-sm text-ink-500">
        Control the categories offered in the sell wizard, homepage and search filters.
      </p>
      <CatalogManager
        kind="category"
        title="Vehicle categories"
        description="Inactive categories are hidden from posting and browsing."
        fields={fields}
        columns={[
          { key: "name", label: "Category" },
          { key: "slug", label: "Slug" },
          { key: "parentId", label: "Parent" },
          { key: "sortOrder", label: "Order" },
          { key: "isActive", label: "Status" },
        ]}
        rows={categories as CatalogRow[]}
      />
    </div>
  );
}
