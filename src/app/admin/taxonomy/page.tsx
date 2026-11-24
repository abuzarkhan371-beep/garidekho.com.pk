import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TAXONOMY_GROUPS } from "@/lib/taxonomy";
import { CatalogManager, type CatalogField, type CatalogRow } from "@/components/admin/catalog-manager";

export const metadata: Metadata = { title: "Ad form options", robots: { index: false, follow: false } };

export default async function AdminTaxonomyPage() {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "taxonomy.manage")) redirect("/admin");

  const options = await prisma.taxonomyOption.findMany({
    orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
  });

  const fields: CatalogField[] = [
    {
      name: "groupName",
      label: "Option group",
      type: "select",
      required: true,
      options: TAXONOMY_GROUPS.map((group) => ({ value: group.value, label: group.label })),
    },
    { name: "label", label: "Display label", required: true, hint: "This is what sellers and buyers see." },
    {
      name: "value",
      label: "Stored value",
      placeholder: "Auto-generated from label",
      hint: "Uppercase letters and underscores. Leave blank to generate it.",
    },
    { name: "sortOrder", label: "Sort order", type: "number" },
    { name: "icon", label: "Icon (optional)" },
    { name: "description", label: "Description (optional)", type: "textarea" },
    { name: "isActive", label: "Active (shown in forms and filters)", type: "checkbox" },
    { name: "isDefault", label: "Default selection", type: "checkbox" },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold">Ad form options</h1>
      <p className="mt-1 text-sm text-ink-500">
        Add or edit body types, fuel types, transmissions, assembly, condition and feature checkboxes. Changes appear in the sell wizard and search filters immediately.
      </p>
      <CatalogManager
        kind="option"
        title="Dynamic options"
        description="Every active option is available to sellers and buyers without a deployment."
        fields={fields}
        columns={[
          { key: "label", label: "Label" },
          { key: "groupName", label: "Group" },
          { key: "value", label: "Value" },
          { key: "sortOrder", label: "Order" },
          { key: "isActive", label: "Status" },
        ]}
        rows={options as CatalogRow[]}
      />
    </div>
  );
}
