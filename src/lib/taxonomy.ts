import "server-only";
import { prisma } from "@/lib/db";
import type { TaxonomyGroup } from "@/generated/prisma/enums";

export type TaxonomyOptionData = {
  id: string;
  groupName: TaxonomyGroup;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export const TAXONOMY_GROUPS = [
  { value: "BODY_TYPE", label: "Body types" },
  { value: "FUEL_TYPE", label: "Fuel types" },
  { value: "TRANSMISSION", label: "Transmissions" },
  { value: "ASSEMBLY_TYPE", label: "Assembly types" },
  { value: "CONDITION", label: "Vehicle conditions" },
  { value: "FEATURE", label: "Features & specifications" },
] as const satisfies ReadonlyArray<{ value: TaxonomyGroup; label: string }>;

/** Active options for one or more groups, ordered for forms and filters. */
export async function getTaxonomyOptions(groups?: TaxonomyGroup[]): Promise<TaxonomyOptionData[]> {
  return prisma.taxonomyOption.findMany({
    where: {
      isActive: true,
      ...(groups?.length ? { groupName: { in: groups } } : {}),
    },
    select: {
      id: true,
      groupName: true,
      value: true,
      label: true,
      sortOrder: true,
      isActive: true,
    },
    orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
  });
}

export function optionsForGroup(options: TaxonomyOptionData[], group: TaxonomyGroup) {
  return options.filter((option) => option.groupName === group);
}

export function optionsToChoices(options: TaxonomyOptionData[]) {
  return options.map((option) => ({ value: option.value, label: option.label }));
}

export function optionsToLabelMap(options: TaxonomyOptionData[]) {
  return Object.fromEntries(options.map((option) => [option.value, option.label])) as Record<string, string>;
}

/** Rejects values that are not active admin-managed options. */
export async function validateTaxonomyValues(values: {
  bodyType?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
  assemblyType?: string | null;
  condition?: string | null;
  features?: string[];
}) {
  const pairs: [TaxonomyGroup, string][] = [];
  const push = (group: TaxonomyGroup, value?: string | null) => {
    if (value) pairs.push([group, value]);
  };
  push("BODY_TYPE", values.bodyType);
  push("FUEL_TYPE", values.fuelType);
  push("TRANSMISSION", values.transmission);
  push("ASSEMBLY_TYPE", values.assemblyType);
  push("CONDITION", values.condition);
  for (const feature of values.features ?? []) push("FEATURE", feature);

  if (pairs.length === 0) return { valid: true as const };

  const existing = await prisma.taxonomyOption.findMany({
    where: {
      isActive: true,
      OR: pairs.map(([groupName, value]) => ({ groupName, value })),
    },
    select: { groupName: true, value: true },
  });
  const available = new Set(existing.map((option) => `${option.groupName}:${option.value}`));
  const invalid = pairs.find(([group, value]) => !available.has(`${group}:${value}`));
  return invalid
    ? { valid: false as const, group: invalid[0], value: invalid[1] }
    : { valid: true as const };
}
