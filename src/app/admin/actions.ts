"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser, hasPermission } from "@/lib/auth";
import {
  SITE_CUSTOMIZER_KEY,
  siteCustomizerSchema,
} from "@/lib/customizer/config";
import { configFromUnknown } from "@/lib/customizer/theme";
import { prisma } from "@/lib/db";
import { validateTaxonomyValues } from "@/lib/taxonomy";

const moderateSchema = z.object({
  listingId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(500).optional(),
});

const featuredSchema = z.object({
  listingId: z.string().min(1),
  featured: z.enum(["true", "false"]),
});

const reportSchema = z.object({
  reportId: z.string().min(1),
  decision: z.enum(["RESOLVE", "DISMISS", "IN_REVIEW"]),
  resolution: z.string().trim().max(1000).optional(),
});

const userStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
});

const editListingSchema = z.object({
  listingId: z.string().min(1),
  title: z.string().trim().min(10, "Title must be at least 10 characters").max(140),
  description: z.string().trim().min(30, "Description must be at least 30 characters").max(8000),
  price: z.coerce.number().int().min(1000, "Enter a valid price").max(1_000_000_000),
  status: z.enum(["DRAFT", "PENDING", "ACTIVE", "REJECTED", "EXPIRED", "SOLD"]),
  cityId: z.string().min(1, "Select a city"),
  areaId: z.string().optional(),
  sellerName: z.string().trim().min(2).max(80),
  sellerPhone: z.string().trim().regex(/^\+92\d{10}$/, "Enter a valid Pakistani mobile number"),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  mileageKm: z.coerce.number().int().min(0).max(2_000_000),
  transmission: z.string().trim().max(64),
  fuelType: z.string().trim().max(64),
  bodyType: z.string().trim().max(64),
  assemblyType: z.string().trim().max(64).optional().or(z.literal("")),
  condition: z.string().trim().max(64).optional().or(z.literal("")),
  negotiable: z.boolean(),
});

const deleteListingSchema = z.object({
  listingId: z.string().min(1),
  reason: z.string().trim().min(5, "Give a short removal reason").max(500),
});

const autoApproveSchema = z.object({
  enabled: z.enum(["true", "false"]),
});

type ActionResult = { ok: boolean; message: string };

function refreshAdminPaths(listingSlug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/users");
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/my-ads");
  if (listingSlug) revalidatePath(`/listings/${listingSlug}`);
}

export async function setAutoApproveAction(formData: FormData): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "settings.manage")) {
    return { ok: false, message: "You are not authorised to change moderation settings." };
  }

  const parsed = autoApproveSchema.safeParse({ enabled: formData.get("enabled") });
  if (!parsed.success) return { ok: false, message: "Invalid moderation setting." };

  const enabled = parsed.data.enabled === "true";
  const setting = await prisma.siteSetting.findUnique({
    where: { key: SITE_CUSTOMIZER_KEY },
    select: { value: true },
  });
  const current = configFromUnknown(setting?.value);
  const next = siteCustomizerSchema.safeParse({
    ...current,
    settings: {
      ...current.settings,
      moderation: { autoApprove: enabled },
    },
  });
  if (!next.success) return { ok: false, message: "Could not save this moderation setting." };

  await prisma.$transaction([
    prisma.siteSetting.upsert({
      where: { key: SITE_CUSTOMIZER_KEY },
      update: {
        value: next.data,
        description: "Published appearance, content and marketplace settings",
      },
      create: {
        key: SITE_CUSTOMIZER_KEY,
        value: next.data,
        description: "Published appearance, content and marketplace settings",
      },
    }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "AUTO_APPROVE_UPDATED",
        targetType: "SITE_SETTING",
        targetId: SITE_CUSTOMIZER_KEY,
        details: { autoApprove: enabled },
      },
    }),
  ]);

  revalidatePath("/", "layout");
  revalidatePath("/admin/listings");
  revalidatePath("/admin/customizer");
  return {
    ok: true,
    message: enabled
      ? "Auto-approve is on. New ads will go live immediately."
      : "Auto-approve is off. New ads will wait for moderation.",
  };
}

export async function moderateListingAction(formData: FormData): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "listing.moderate")) {
    return { ok: false, message: "You are not authorised to moderate listings." };
  }

  const parsed = moderateSchema.safeParse({
    listingId: formData.get("listingId"),
    decision: formData.get("decision"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Invalid moderation request." };

  const { listingId, decision, reason } = parsed.data;
  if (decision === "REJECT" && !reason) {
    return { ok: false, message: "A rejection reason is required." };
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, slug: true, title: true, status: true, userId: true },
  });
  if (!listing) return { ok: false, message: "Listing not found." };
  if (listing.status !== "PENDING") {
    return { ok: false, message: "Only pending listings can be moderated." };
  }

  const approved = decision === "APPROVE";
  const status = approved ? "ACTIVE" : "REJECTED";

  await prisma.$transaction([
    prisma.listing.update({
      where: { id: listing.id },
      data: {
        status,
        rejectionReason: approved ? null : reason ?? null,
        moderationNote: approved ? "Approved by moderation" : reason ?? null,
      },
    }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: approved ? "LISTING_APPROVED" : "LISTING_REJECTED",
        targetType: "LISTING",
        targetId: listing.id,
        details: {
          title: listing.title,
          previousStatus: listing.status,
          reason: reason ?? null,
        },
      },
    }),
    prisma.notification.create({
      data: {
        userId: listing.userId,
        listingId: listing.id,
        type: approved ? "LISTING_APPROVED" : "LISTING_REJECTED",
        title: approved ? "Your ad is live" : "Your ad needs attention",
        body: approved
          ? `“${listing.title}” has been approved and is now visible to buyers.`
          : `“${listing.title}” was not approved. ${reason ?? "Please review your listing."}`,
        href: approved ? `/listings/${listing.slug}` : "/my-ads",
      },
    }),
  ]);

  refreshAdminPaths(listing.slug);
  return { ok: true, message: approved ? "Listing approved and published." : "Listing rejected." };
}

export async function toggleFeaturedAction(formData: FormData): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "listing.promote")) {
    return { ok: false, message: "You are not authorised to promote listings." };
  }

  const parsed = featuredSchema.safeParse({
    listingId: formData.get("listingId"),
    featured: formData.get("featured"),
  });
  if (!parsed.success) return { ok: false, message: "Invalid promotion request." };

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true, slug: true, title: true, status: true, isFeatured: true, userId: true },
  });
  if (!listing || listing.status !== "ACTIVE") {
    return { ok: false, message: "Only active listings can be featured." };
  }

  const featured = parsed.data.featured === "true";
  if (listing.isFeatured === featured) {
    return { ok: true, message: featured ? "Listing is already featured." : "Listing is not featured." };
  }

  await prisma.$transaction([
    prisma.listing.update({ where: { id: listing.id }, data: { isFeatured: featured } }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: featured ? "LISTING_FEATURED" : "LISTING_UNFEATURED",
        targetType: "LISTING",
        targetId: listing.id,
        details: { title: listing.title },
      },
    }),
    prisma.notification.create({
      data: {
        userId: listing.userId,
        listingId: listing.id,
        type: "PROMOTION_ACTIVE",
        title: featured ? "Your ad is featured" : "Featured status removed",
        body: featured
          ? `“${listing.title}” now appears in featured placements across Garidekho.`
          : `“${listing.title}” is no longer featured.`,
        href: `/listings/${listing.slug}`,
      },
    }),
  ]);

  refreshAdminPaths(listing.slug);
  return { ok: true, message: featured ? "Listing is now featured." : "Featured status removed." };
}

export async function resolveReportAction(formData: FormData): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "report.manage")) {
    return { ok: false, message: "You are not authorised to manage reports." };
  }

  const parsed = reportSchema.safeParse({
    reportId: formData.get("reportId"),
    decision: formData.get("decision"),
    resolution: formData.get("resolution") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Invalid report request." };

  const report = await prisma.report.findUnique({
    where: { id: parsed.data.reportId },
    select: { id: true, status: true, reporterId: true },
  });
  if (!report) return { ok: false, message: "Report not found." };
  if (report.status === "RESOLVED" || report.status === "DISMISSED") {
    return { ok: false, message: "This report is already closed." };
  }
  if (parsed.data.decision !== "IN_REVIEW" && !parsed.data.resolution) {
    return { ok: false, message: "Add a short resolution note." };
  }

  const status = parsed.data.decision === "RESOLVE" ? "RESOLVED" : parsed.data.decision === "DISMISS" ? "DISMISSED" : "IN_REVIEW";
  await prisma.$transaction([
    prisma.report.update({
      where: { id: report.id },
      data: {
        status,
        handledById: admin.id,
        resolution: parsed.data.resolution ?? null,
        resolvedAt: status === "RESOLVED" || status === "DISMISSED" ? new Date() : null,
      },
    }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: `REPORT_${status}`,
        targetType: "REPORT",
        targetId: report.id,
        details: { previousStatus: report.status, resolution: parsed.data.resolution ?? null },
      },
    }),
    ...(report.reporterId
      ? [
          prisma.notification.create({
            data: {
              userId: report.reporterId,
              type: "REPORT_UPDATE",
              title: "Report update",
              body: `Your report was marked ${status.toLowerCase()}.${parsed.data.resolution ? ` ${parsed.data.resolution}` : ""}`,
              href: "/help",
            },
          }),
        ]
      : []),
  ]);

  refreshAdminPaths();
  return { ok: true, message: `Report marked ${status.toLowerCase()}.` };
}

export async function setUserStatusAction(formData: FormData): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "user.manage")) {
    return { ok: false, message: "You are not authorised to manage users." };
  }

  const parsed = userStatusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return { ok: false, message: "Invalid user status request." };

  if (parsed.data.userId === admin.id) {
    return { ok: false, message: "You cannot change your own account status." };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, status: true, roleName: true },
  });
  if (!target) return { ok: false, message: "User not found." };
  if (target.roleName === "SUPER_ADMIN" && parsed.data.status !== "ACTIVE") {
    return { ok: false, message: "Super admin accounts cannot be suspended." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: target.id }, data: { status: parsed.data.status } }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "USER_STATUS_CHANGED",
        targetType: "USER",
        targetId: target.id,
        details: { from: target.status, to: parsed.data.status },
      },
    }),
  ]);

  refreshAdminPaths();
  return { ok: true, message: `User ${parsed.data.status.toLowerCase()}.` };
}

export async function updateListingDetailsAction(formData: FormData): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "listing.moderate")) {
    return { ok: false, message: "You are not authorised to edit listings." };
  }

  const parsed = editListingSchema.safeParse({
    listingId: formData.get("listingId"),
    title: formData.get("title"),
    description: formData.get("description"),
    price: formData.get("price"),
    status: formData.get("status"),
    cityId: formData.get("cityId"),
    areaId: formData.get("areaId") || undefined,
    sellerName: formData.get("sellerName"),
    sellerPhone: formData.get("sellerPhone"),
    year: formData.get("year"),
    mileageKm: formData.get("mileageKm"),
    transmission: formData.get("transmission"),
    fuelType: formData.get("fuelType"),
    bodyType: formData.get("bodyType"),
    assemblyType: formData.get("assemblyType") || undefined,
    condition: formData.get("condition") || undefined,
    negotiable: formData.get("negotiable") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid listing details." };

  const data = parsed.data;
  const taxonomyCheck = await validateTaxonomyValues({
    bodyType: data.bodyType,
    fuelType: data.fuelType,
    transmission: data.transmission,
    assemblyType: data.assemblyType,
    condition: data.condition,
  });
  if (!taxonomyCheck.valid) {
    return { ok: false, message: `“${taxonomyCheck.value}” is no longer an available ${taxonomyCheck.group.toLowerCase()} option.` };
  }

  const existing = await prisma.listing.findUnique({
    where: { id: data.listingId },
    select: { id: true, slug: true, title: true, status: true, userId: true, publishedAt: true, vehicleId: true },
  });
  if (!existing) return { ok: false, message: "Listing not found." };

  const publishedAt = data.status === "ACTIVE" ? (existing.publishedAt ?? new Date()) : null;
  await prisma.$transaction([
    prisma.listing.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        negotiable: data.negotiable,
        status: data.status,
        publishedAt,
        cityId: data.cityId,
        areaId: data.areaId || null,
        sellerName: data.sellerName,
        sellerPhone: data.sellerPhone,
        moderationNote: "Edited by administrator",
      },
    }),
    prisma.vehicle.update({
      where: { id: existing.vehicleId },
      data: {
        year: data.year,
        mileageKm: data.mileageKm,
        transmission: data.transmission,
        fuelType: data.fuelType,
        bodyType: data.bodyType,
        assemblyType: data.assemblyType || null,
        condition: data.condition || null,
      },
    }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "LISTING_EDITED",
        targetType: "LISTING",
        targetId: existing.id,
        details: {
          title: data.title,
          previousStatus: existing.status,
          nextStatus: data.status,
          price: data.price,
        },
      },
    }),
    prisma.notification.create({
      data: {
        userId: existing.userId,
        listingId: existing.id,
        type: "SYSTEM",
        title: "Your ad was updated",
        body: `An administrator updated “${data.title}”. Review the latest details in My Ads.`,
        href: "/my-ads",
      },
    }),
  ]);

  refreshAdminPaths(existing.slug);
  return { ok: true, message: "Listing details saved." };
}

export async function deleteListingAction(formData: FormData): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "listing.moderate")) {
    return { ok: false, message: "You are not authorised to remove listings." };
  }

  const parsed = deleteListingSchema.safeParse({
    listingId: formData.get("listingId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid removal request." };

  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { id: true, slug: true, title: true, userId: true, deletedAt: true },
  });
  if (!listing) return { ok: false, message: "Listing not found." };
  if (listing.deletedAt) return { ok: false, message: "This listing was already removed." };

  await prisma.$transaction([
    prisma.listing.update({
      where: { id: listing.id },
      data: {
        deletedAt: new Date(),
        status: "REJECTED",
        isFeatured: false,
        rejectionReason: parsed.data.reason,
        moderationNote: `Removed by administrator: ${parsed.data.reason}`,
      },
    }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "LISTING_DELETED",
        targetType: "LISTING",
        targetId: listing.id,
        details: { title: listing.title, reason: parsed.data.reason },
      },
    }),
    prisma.notification.create({
      data: {
        userId: listing.userId,
        listingId: listing.id,
        type: "LISTING_REJECTED",
        title: "Your ad was removed",
        body: `“${listing.title}” was removed from Garidekho. Reason: ${parsed.data.reason}`,
        href: "/my-ads",
      },
    }),
  ]);

  refreshAdminPaths(listing.slug);
  return { ok: true, message: "Listing removed from the marketplace." };
}

export async function verifySellerAction(formData: FormData): Promise<ActionResult> {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "user.manage")) {
    return { ok: false, message: "You are not authorised to verify sellers." };
  }

  const parsed = z.object({ userId: z.string().min(1) }).safeParse({ userId: formData.get("userId") });
  if (!parsed.success) return { ok: false, message: "Invalid seller request." };

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      email: true,
      profile: { select: { identityStatus: true, phoneVerifiedAt: true } },
      dealer: { select: { id: true, verificationStatus: true } },
    },
  });
  if (!target) return { ok: false, message: "Seller not found." };
  if (target.profile?.identityStatus === "VERIFIED" && (!target.dealer || target.dealer.verificationStatus === "VERIFIED")) {
    return { ok: true, message: "This seller is already verified." };
  }

  await prisma.$transaction([
    ...(target.profile
      ? [
          prisma.userProfile.update({
            where: { userId: target.id },
            data: {
              identityStatus: "VERIFIED",
              phoneVerifiedAt: target.profile.phoneVerifiedAt ?? new Date(),
            },
          }),
        ]
      : []),
    ...(target.dealer
      ? [
          prisma.dealer.update({
            where: { id: target.dealer.id },
            data: { verificationStatus: "VERIFIED", verifiedAt: new Date() },
          }),
        ]
      : []),
    prisma.listing.updateMany({
      where: { userId: target.id, deletedAt: null },
      data: { isVerified: true },
    }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "SELLER_VERIFIED",
        targetType: "USER",
        targetId: target.id,
        details: { email: target.email },
      },
    }),
    prisma.notification.create({
      data: {
        userId: target.id,
        type: "SYSTEM",
        title: "You're a verified seller",
        body: "Your Garidekho seller profile has been verified. Buyers will see the verified badge on your ads.",
        href: "/my-ads",
      },
    }),
  ]);

  refreshAdminPaths();
  return { ok: true, message: "Seller verified." };
}
