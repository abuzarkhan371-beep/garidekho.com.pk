"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CAR_SPEC_FIELDS, type CarSpecs } from "@/lib/data/car-specs";
import { storeImage } from "@/lib/services/storage";
import { slugify } from "@/lib/utils";
import { uniqueListingSlug } from "@/lib/listings";
import type { ContentActionState } from "@/lib/admin-content";

const ADMIN_SELLER_PHONE = "+923390009333";

const newCarSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter the car name").max(120),
  make: z.string().trim().min(2, "Enter the manufacturer").max(80),
  year: z.coerce.number().int().min(1950).max(2035),
  tab: z.enum(["popular", "upcoming", "launched"]),
  price: z.coerce.number().int().min(100_000).max(1_000_000_000),
  imageUrl: z.string().trim().max(1000).optional().or(z.literal("")),
  summary: z.string().trim().max(600).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.enum(["true", "false"]),
});

const usedCarSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(10, "Title must be at least 10 characters").max(160),
  description: z.string().trim().min(30, "Description must be at least 30 characters").max(8000),
  price: z.coerce.number().int().min(100_000).max(1_000_000_000),
  year: z.coerce.number().int().min(1950).max(2035),
  mileageKm: z.coerce.number().int().min(0).max(2_000_000),
  categoryId: z.string().min(1, "Select a category"),
  makeId: z.string().optional().or(z.literal("")),
  modelId: z.string().optional().or(z.literal("")),
  cityId: z.string().optional().or(z.literal("")),
  imageUrl: z.string().trim().max(1000).optional().or(z.literal("")),
  isFeatured: z.enum(["true", "false"]),
  isVerified: z.enum(["true", "false"]),
});

const newsSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(8, "Enter a headline").max(180),
  slug: z.string().trim().max(180).optional().or(z.literal("")),
  excerpt: z.string().trim().min(20, "Add a short excerpt").max(500),
  content: z.string().trim().min(40, "Add the article body").max(30000),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  tags: z.string().trim().max(300).optional().or(z.literal("")),
  coverUrl: z.string().trim().max(1000).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(180).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

const idSchema = z.object({ id: z.string().min(1) });
const rankSchema = z.object({
  listingId: z.string().min(1),
  rank: z.coerce.number().int().min(0).max(9999),
});

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function requireCmsAdmin() {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "cms.manage")) return null;
  return admin;
}

async function requirePromotionAdmin() {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "listing.promote")) return null;
  return admin;
}

function specsFromForm(formData: FormData): CarSpecs {
  const specs: Record<string, string | number> = {};
  for (const field of CAR_SPEC_FIELDS) {
    const raw = formData.get(field.key);
    if (typeof raw !== "string" || !raw.trim()) continue;
    if (field.type === "number") {
      const value = Number(raw);
      if (Number.isFinite(value) && value >= 0) specs[field.key] = value;
    } else {
      specs[field.key] = raw.trim();
    }
  }
  return specs as CarSpecs;
}

async function uploadedImageUrl(formData: FormData, adminId: string, fallback = "") {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    const stored = await storeImage(file, adminId);
    return stored.url;
  }
  return fallback;
}

async function uniqueNewCarSlug(name: string, excludeId?: string) {
  const base = slugify(name) || `new-car-${Date.now()}`;
  let slug = base;
  let suffix = 2;
  while (await prisma.newCar.findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined }, select: { id: true } })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

async function uniqueNewsSlug(value: string, excludeId?: string) {
  const base = slugify(value) || `article-${Date.now()}`;
  let slug = base;
  let suffix = 2;
  while (await prisma.newsArticle.findFirst({ where: { slug, id: excludeId ? { not: excludeId } : undefined }, select: { id: true } })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
}

function revalidateHomeContent(extra?: string) {
  revalidatePath("/");
  revalidatePath("/compare");
  revalidatePath("/news");
  revalidatePath("/admin/cars");
  revalidatePath("/admin/news");
  revalidatePath("/admin/featured");
  if (extra) revalidatePath(extra);
}

export async function saveNewCarAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const admin = await requireCmsAdmin();
  if (!admin) return { ok: false, message: "You are not authorised to manage new cars." };

  const parsed = newCarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the new car form." };
  }

  const data = parsed.data;
  try {
    const imageUrl = await uploadedImageUrl(formData, admin.id, data.imageUrl);
    if (!imageUrl) return { ok: false, message: "Add an image URL or upload a photo." };
    const specs = specsFromForm(formData);
    const existing = data.id
      ? await prisma.newCar.findUnique({ where: { id: data.id }, select: { id: true, slug: true } })
      : null;
    const slug = existing?.slug ?? await uniqueNewCarSlug(data.name);

    const saved = await prisma.newCar.upsert({
      where: { id: existing?.id ?? "new" },
      update: {
        slug,
        name: data.name,
        make: data.make,
        year: data.year,
        tab: data.tab,
        price: data.price,
        imageUrl,
        summary: data.summary || null,
        specs,
        sortOrder: data.sortOrder,
        isActive: data.isActive === "true",
      },
      create: {
        slug,
        name: data.name,
        make: data.make,
        year: data.year,
        tab: data.tab,
        price: data.price,
        imageUrl,
        summary: data.summary || null,
        specs,
        sortOrder: data.sortOrder,
        isActive: data.isActive === "true",
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: existing ? "NEW_CAR_UPDATED" : "NEW_CAR_CREATED",
        targetType: "NEW_CAR",
        targetId: saved.id,
        details: { name: saved.name, slug: saved.slug, tab: saved.tab },
      },
    });
    revalidateHomeContent();
    return { ok: true, message: existing ? "New car updated." : "New car added to the catalogue." };
  } catch (error) {
    return { ok: false, message: message(error, "Could not save the new car.") };
  }
}

export async function deleteNewCarAction(formData: FormData): Promise<ContentActionState> {
  const admin = await requireCmsAdmin();
  if (!admin) return { ok: false, message: "You are not authorised to manage new cars." };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, message: "Invalid car reference." };

  const car = await prisma.newCar.findUnique({ where: { id: parsed.data.id }, select: { id: true, name: true } });
  if (!car) return { ok: false, message: "New car not found." };

  await prisma.$transaction([
    prisma.newCar.delete({ where: { id: car.id } }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "NEW_CAR_DELETED",
        targetType: "NEW_CAR",
        targetId: car.id,
        details: { name: car.name },
      },
    }),
  ]);
  revalidateHomeContent();
  return { ok: true, message: `${car.name} removed.` };
}

export async function saveUsedCarAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const admin = await requireCmsAdmin();
  if (!admin) return { ok: false, message: "You are not authorised to manage used cars." };

  const parsed = usedCarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the used car form." };
  }

  const data = parsed.data;
  try {
    const imageUrl = await uploadedImageUrl(formData, admin.id, data.imageUrl);
    if (!imageUrl) return { ok: false, message: "Add an image URL or upload a photo." };
    const specs = specsFromForm(formData);
    const existing = data.id
      ? await prisma.listing.findUnique({
          where: { id: data.id },
          select: { id: true, slug: true, vehicleId: true },
        })
      : null;
    const vehicleData = {
      year: data.year,
      mileageKm: data.mileageKm,
      transmission: typeof specs.transmission === "string" ? specs.transmission : null,
      fuelType: typeof specs.fuelType === "string" ? specs.fuelType : null,
      bodyType: typeof specs.bodyType === "string" ? specs.bodyType : null,
      seats: typeof specs.seatingCapacity === "number" ? specs.seatingCapacity : null,
      specs,
      ...(data.makeId
        ? { make: { connect: { id: data.makeId } } }
        : { make: { disconnect: true } }),
      ...(data.modelId
        ? { model: { connect: { id: data.modelId } } }
        : { model: { disconnect: true } }),
    };

    let listingId: string;
    let slug: string;

    if (existing) {
      listingId = existing.id;
      slug = existing.slug;
      await prisma.$transaction([
        prisma.listing.update({
          where: { id: existing.id },
          data: {
            title: data.title,
            description: data.description,
            price: data.price,
            isFeatured: data.isFeatured === "true",
            isVerified: data.isVerified === "true",
            sellerName: data.title.slice(0, 80),
            sellerPhone: ADMIN_SELLER_PHONE,
          },
        }),
        prisma.vehicle.update({ where: { id: existing.vehicleId }, data: vehicleData }),
        prisma.vehicleImage.updateMany({
          where: { listingId: existing.id, isPrimary: true },
          data: { isPrimary: false },
        }),
        prisma.vehicleImage.create({
          data: { listingId: existing.id, url: imageUrl, publicId: null, position: 999, isPrimary: true },
        }),
      ]);
    } else {
      slug = await uniqueListingSlug(data.title);
      const sellerName = [admin.profile?.firstName, admin.profile?.lastName].filter(Boolean).join(" ") || "Garidekho Admin";
      const listing = await prisma.listing.create({
        data: {
          slug,
          title: data.title,
          description: data.description,
          price: data.price,
          sellerName,
          sellerPhone: ADMIN_SELLER_PHONE,
          status: "ACTIVE",
          publishedAt: new Date(),
          isFeatured: data.isFeatured === "true",
          isVerified: data.isVerified === "true",
          user: { connect: { id: admin.id } },
          city: data.cityId ? { connect: { id: data.cityId } } : undefined,
          vehicle: {
            create: {
              category: { connect: { id: data.categoryId } },
              year: vehicleData.year,
              mileageKm: vehicleData.mileageKm,
              transmission: vehicleData.transmission,
              fuelType: vehicleData.fuelType,
              bodyType: vehicleData.bodyType,
              seats: vehicleData.seats,
              specs,
              make: data.makeId ? { connect: { id: data.makeId } } : undefined,
              model: data.modelId ? { connect: { id: data.modelId } } : undefined,
            },
          },
          images: {
            create: { url: imageUrl, publicId: null, position: 0, isPrimary: true },
          },
        },
      });
      listingId = listing.id;
    }

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: existing ? "USED_CAR_UPDATED" : "USED_CAR_CREATED",
        targetType: "LISTING",
        targetId: listingId,
        details: { title: data.title, isFeatured: data.isFeatured === "true" },
      },
    });
    revalidateHomeContent(`/listings/${slug}`);
    return { ok: true, message: existing ? "Used car updated." : "Used car published." };
  } catch (error) {
    return { ok: false, message: message(error, "Could not save the used car.") };
  }
}

export async function setFeaturedRankAction(formData: FormData): Promise<ContentActionState> {
  const admin = await requirePromotionAdmin();
  if (!admin) return { ok: false, message: "You are not authorised to promote listings." };

  const parsed = rankSchema.safeParse({
    listingId: formData.get("listingId"),
    rank: formData.get("rank"),
  });
  if (!parsed.success) return { ok: false, message: "Enter a valid display rank." };

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true, isFeatured: true },
  });
  if (!listing?.isFeatured) return { ok: false, message: "Only featured ads have a display rank." };

  await prisma.$transaction([
    prisma.listing.update({ where: { id: listing.id }, data: { featuredRank: parsed.data.rank } }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "FEATURED_RANK_UPDATED",
        targetType: "LISTING",
        targetId: listing.id,
        details: { rank: parsed.data.rank },
      },
    }),
  ]);
  revalidateHomeContent();
  return { ok: true, message: `Featured rank set to ${parsed.data.rank}.` };
}

export async function saveNewsArticleAction(
  _prev: ContentActionState,
  formData: FormData,
): Promise<ContentActionState> {
  const admin = await requireCmsAdmin();
  if (!admin) return { ok: false, message: "You are not authorised to manage news." };

  const parsed = newsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the news form." };
  }

  const data = parsed.data;
  try {
    const coverUrl = await uploadedImageUrl(formData, admin.id, data.coverUrl);
    if (!coverUrl) return { ok: false, message: "Add a cover image URL or upload a photo." };

    const existing = data.id
      ? await prisma.newsArticle.findUnique({ where: { id: data.id }, select: { id: true, publishedAt: true } })
      : null;
    const slug = await uniqueNewsSlug(data.slug || data.title, existing?.id);
    const publishedAt = data.status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : null;
    const tags = data.tags
      ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 10)
      : [];

    const saved = await prisma.newsArticle.upsert({
      where: { id: existing?.id ?? "new" },
      update: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        coverUrl,
        category: data.category || null,
        tags,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: data.status,
        publishedAt,
        authorId: admin.id,
      },
      create: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        coverUrl,
        category: data.category || null,
        tags,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: data.status,
        publishedAt,
        authorId: admin.id,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: existing ? "NEWS_UPDATED" : "NEWS_CREATED",
        targetType: "NEWS_ARTICLE",
        targetId: saved.id,
        details: { title: saved.title, status: saved.status },
      },
    });
    revalidateHomeContent(`/news/${saved.slug}`);
    return { ok: true, message: existing ? "Article updated." : "Article saved." };
  } catch (error) {
    return { ok: false, message: message(error, "Could not save the article.") };
  }
}

export async function deleteNewsArticleAction(formData: FormData): Promise<ContentActionState> {
  const admin = await requireCmsAdmin();
  if (!admin) return { ok: false, message: "You are not authorised to manage news." };

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, message: "Invalid article reference." };

  const article = await prisma.newsArticle.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, title: true, slug: true },
  });
  if (!article) return { ok: false, message: "Article not found." };

  await prisma.$transaction([
    prisma.newsArticle.delete({ where: { id: article.id } }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "NEWS_DELETED",
        targetType: "NEWS_ARTICLE",
        targetId: article.id,
        details: { title: article.title },
      },
    }),
  ]);
  revalidateHomeContent(`/news/${article.slug}`);
  return { ok: true, message: "Article deleted." };
}
