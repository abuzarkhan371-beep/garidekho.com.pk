"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type CatalogKind = "category" | "make" | "model" | "province" | "city" | "area" | "option";

type ActionResult = { ok: boolean; message: string };

const OPTION_GROUPS = ["BODY_TYPE", "FUEL_TYPE", "TRANSMISSION", "ASSEMBLY_TYPE", "CONDITION", "FEATURE"] as const;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function optionalNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function permissionFor(kind: CatalogKind) {
  if (kind === "category") return "category.manage";
  if (kind === "province" || kind === "city" || kind === "area") return "location.manage";
  return "taxonomy.manage";
}

const labels: Record<CatalogKind, string> = {
  category: "Category",
  make: "Brand",
  model: "Model",
  province: "Province",
  city: "City",
  area: "Area",
  option: "Form option",
};

function refreshCatalog() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/brands");
  revalidatePath("/admin/locations");
  revalidatePath("/admin/taxonomy");
  revalidatePath("/search");
  revalidatePath("/sell");
  revalidatePath("/cities");
  revalidatePath("/", "layout");
}

async function uniqueSlug(
  base: string,
  find: (candidate: string) => Promise<{ id: string } | null>,
  excludeId?: string,
) {
  const root = slugify(base, { lower: true, strict: true, trim: true }).slice(0, 70) || "item";
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt}`;
    const existing = await find(candidate);
    if (!existing || existing.id === excludeId) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function saveCatalogItemAction(kind: CatalogKind, formData: FormData): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, permissionFor(kind))) {
    return { ok: false, message: `You are not authorised to manage ${labels[kind].toLowerCase()}s.` };
  }

  const id = text(formData, "id") || undefined;
  const name = text(formData, "name");
  if (!name && kind !== "option") return { ok: false, message: "Name is required." };
  const label = kind === "option" ? text(formData, "label") : name;
  if (!label) return { ok: false, message: "Label is required." };

  try {
    let targetId = id ?? "";
    let action = id ? "CATALOG_UPDATED" : "CATALOG_CREATED";

    switch (kind) {
      case "category": {
        const slug = await uniqueSlug(
          text(formData, "slug") || name,
          (candidate) => prisma.category.findFirst({
            where: { slug: candidate, ...(id ? { id: { not: id } } : {}) },
            select: { id: true },
          }),
          id,
        );
        const parentId = text(formData, "parentId") || null;
        const data = {
          name,
          slug,
          description: text(formData, "description") || null,
          icon: text(formData, "icon") || null,
          sortOrder: Number(text(formData, "sortOrder")) || 0,
          isActive: checked(formData, "isActive"),
          parentId: parentId === id ? null : parentId,
        };
        const saved = id
          ? await prisma.category.update({ where: { id }, data })
          : await prisma.category.create({ data });
        targetId = saved.id;
        break;
      }
      case "make": {
        const slug = await uniqueSlug(
          text(formData, "slug") || name,
          (candidate) => prisma.vehicleMake.findFirst({
            where: { slug: candidate, ...(id ? { id: { not: id } } : {}) },
            select: { id: true },
          }),
          id,
        );
        const data = {
          name,
          slug,
          logoUrl: text(formData, "logoUrl") || null,
          country: text(formData, "country") || null,
          description: text(formData, "description") || null,
          isPopular: checked(formData, "isPopular"),
          isActive: checked(formData, "isActive"),
        };
        const saved = id
          ? await prisma.vehicleMake.update({ where: { id }, data })
          : await prisma.vehicleMake.create({ data });
        targetId = saved.id;
        break;
      }
      case "model": {
        const makeId = text(formData, "makeId");
        if (!makeId) return { ok: false, message: "Select a brand for this model." };
        const make = await prisma.vehicleMake.findUnique({ where: { id: makeId }, select: { id: true } });
        if (!make) return { ok: false, message: "Selected brand no longer exists." };
        const slug = await uniqueSlug(
          text(formData, "slug") || `${name} ${text(formData, "yearFrom")}`,
          (candidate) => prisma.vehicleModel.findFirst({
            where: { slug: candidate, ...(id ? { id: { not: id } } : {}) },
            select: { id: true },
          }),
          id,
        );
        const data = {
          makeId,
          name,
          slug,
          yearFrom: optionalNumber(text(formData, "yearFrom")),
          yearTo: optionalNumber(text(formData, "yearTo")),
          description: text(formData, "description") || null,
          isActive: checked(formData, "isActive"),
        };
        const saved = id
          ? await prisma.vehicleModel.update({ where: { id }, data })
          : await prisma.vehicleModel.create({ data });
        targetId = saved.id;
        break;
      }
      case "province": {
        const code = text(formData, "code").toUpperCase();
        if (code.length < 2) return { ok: false, message: "Province code is required." };
        const slug = await uniqueSlug(
          text(formData, "slug") || name,
          (candidate) => prisma.province.findFirst({
            where: { slug: candidate, ...(id ? { id: { not: id } } : {}) },
            select: { id: true },
          }),
          id,
        );
        const data = { name, slug, code, capital: text(formData, "capital") || null };
        const saved = id
          ? await prisma.province.update({ where: { id }, data })
          : await prisma.province.create({ data });
        targetId = saved.id;
        break;
      }
      case "city": {
        const provinceId = text(formData, "provinceId");
        if (!provinceId) return { ok: false, message: "Select a province for this city." };
        const province = await prisma.province.findUnique({ where: { id: provinceId }, select: { id: true } });
        if (!province) return { ok: false, message: "Selected province no longer exists." };
        const slug = await uniqueSlug(
          text(formData, "slug") || name,
          (candidate) => prisma.city.findFirst({
            where: { slug: candidate, ...(id ? { id: { not: id } } : {}) },
            select: { id: true },
          }),
          id,
        );
        const data = {
          provinceId,
          name,
          slug,
          latitude: optionalNumber(text(formData, "latitude")),
          longitude: optionalNumber(text(formData, "longitude")),
          isMajor: checked(formData, "isMajor"),
          imageUrl: text(formData, "imageUrl") || null,
          description: text(formData, "description") || null,
        };
        const saved = id
          ? await prisma.city.update({ where: { id }, data })
          : await prisma.city.create({ data });
        targetId = saved.id;
        break;
      }
      case "area": {
        const cityId = text(formData, "cityId");
        if (!cityId) return { ok: false, message: "Select a city for this area." };
        const city = await prisma.city.findUnique({ where: { id: cityId }, select: { id: true } });
        if (!city) return { ok: false, message: "Selected city no longer exists." };
        const slug = await uniqueSlug(
          text(formData, "slug") || name,
          (candidate) => prisma.area.findFirst({
            where: { cityId, slug: candidate, ...(id ? { id: { not: id } } : {}) },
            select: { id: true },
          }),
          id,
        );
        const saved = id
          ? await prisma.area.update({ where: { id }, data: { cityId, name, slug } })
          : await prisma.area.create({ data: { cityId, name, slug } });
        targetId = saved.id;
        break;
      }
      case "option": {
        const group = text(formData, "groupName") as (typeof OPTION_GROUPS)[number];
        if (!OPTION_GROUPS.includes(group)) return { ok: false, message: "Choose a valid option group." };
        const rawValue = (text(formData, "value") || label).slice(0, 64);
        // Feature values stay human-readable because existing listings store the checkbox label.
        const value = group === "FEATURE"
          ? rawValue
          : rawValue.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
        if (!value) return { ok: false, message: "Option value is required." };
        const existing = await prisma.taxonomyOption.findUnique({
          where: { groupName_value: { groupName: group, value } },
          select: { id: true },
        });
        if (existing && existing.id !== id) {
          return { ok: false, message: "This value already exists in that group." };
        }
        const data = {
          groupName: group,
          value,
          label,
          description: text(formData, "description") || null,
          icon: text(formData, "icon") || null,
          sortOrder: Number(text(formData, "sortOrder")) || 0,
          isActive: checked(formData, "isActive"),
          isDefault: checked(formData, "isDefault"),
        };
        const saved = id
          ? await prisma.taxonomyOption.update({ where: { id }, data })
          : await prisma.taxonomyOption.create({ data });
        targetId = saved.id;
        break;
      }
    }

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action,
        targetType: kind.toUpperCase(),
        targetId,
        details: { kind, name: label, ...(id ? { updated: true } : {}) },
      },
    });

    refreshCatalog();
    return { ok: true, message: `${labels[kind]} ${id ? "updated" : "created"} successfully.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : `Could not save ${labels[kind].toLowerCase()}.` };
  }
}

export async function deleteCatalogItemAction(kind: CatalogKind, formData: FormData): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, permissionFor(kind))) {
    return { ok: false, message: `You are not authorised to manage ${labels[kind].toLowerCase()}s.` };
  }

  const id = text(formData, "id");
  if (!id) return { ok: false, message: "Missing item id." };

  try {
    let name = labels[kind];

    switch (kind) {
      case "category": {
        const item = await prisma.category.findUnique({
          where: { id },
          select: { name: true, _count: { select: { vehicles: true, children: true } } },
        });
        if (!item) return { ok: false, message: "Category not found." };
        if (item._count.vehicles || item._count.children) {
          return { ok: false, message: "This category still has vehicles or subcategories. Move them or deactivate it instead." };
        }
        name = item.name;
        await prisma.category.delete({ where: { id } });
        break;
      }
      case "make": {
        const item = await prisma.vehicleMake.findUnique({
          where: { id },
          select: { name: true, _count: { select: { models: true, vehicles: true } } },
        });
        if (!item) return { ok: false, message: "Brand not found." };
        if (item._count.models || item._count.vehicles) {
          return { ok: false, message: "This brand still has models or listings. Delete its models first or deactivate it." };
        }
        name = item.name;
        await prisma.vehicleMake.delete({ where: { id } });
        break;
      }
      case "model": {
        const item = await prisma.vehicleModel.findUnique({
          where: { id },
          select: { name: true, _count: { select: { variants: true, vehicles: true } } },
        });
        if (!item) return { ok: false, message: "Model not found." };
        if (item._count.variants || item._count.vehicles) {
          return { ok: false, message: "This model still has variants or listings. Deactivate it instead." };
        }
        name = item.name;
        await prisma.vehicleModel.delete({ where: { id } });
        break;
      }
      case "province": {
        const item = await prisma.province.findUnique({
          where: { id },
          select: { name: true, _count: { select: { cities: true, dealers: true } } },
        });
        if (!item) return { ok: false, message: "Province not found." };
        if (item._count.cities || item._count.dealers) {
          return { ok: false, message: "This province still has cities or dealers." };
        }
        name = item.name;
        await prisma.province.delete({ where: { id } });
        break;
      }
      case "city": {
        const item = await prisma.city.findUnique({
          where: { id },
          select: {
            name: true,
            _count: {
              select: { areas: true, listings: true, registeredListings: true, profiles: true, dealers: true },
            },
          },
        });
        if (!item) return { ok: false, message: "City not found." };
        if (
          item._count.areas || item._count.listings || item._count.registeredListings ||
          item._count.profiles || item._count.dealers
        ) {
          return { ok: false, message: "This city is still referenced by areas, ads, profiles or dealers." };
        }
        name = item.name;
        await prisma.city.delete({ where: { id } });
        break;
      }
      case "area": {
        const item = await prisma.area.findUnique({
          where: { id },
          select: { name: true, _count: { select: { listings: true } } },
        });
        if (!item) return { ok: false, message: "Area not found." };
        if (item._count.listings) return { ok: false, message: "This area still has listings." };
        name = item.name;
        await prisma.area.delete({ where: { id } });
        break;
      }
      case "option": {
        const item = await prisma.taxonomyOption.findUnique({ where: { id }, select: { label: true } });
        if (!item) return { ok: false, message: "Form option not found." };
        name = item.label;
        await prisma.taxonomyOption.delete({ where: { id } });
        break;
      }
    }

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "CATALOG_DELETED",
        targetType: kind.toUpperCase(),
        targetId: id,
        details: { kind, name },
      },
    });

    refreshCatalog();
    return { ok: true, message: `${name} deleted.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : `Could not delete ${labels[kind].toLowerCase()}.` };
  }
}
