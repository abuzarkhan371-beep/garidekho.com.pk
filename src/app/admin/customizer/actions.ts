"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SITE_CUSTOMIZER_KEY, siteCustomizerSchema } from "@/lib/customizer/config";
import { storeImage } from "@/lib/services/storage";

type ActionResult = { ok: boolean; message: string; url?: string };

const uploadSchema = z.object({
  slot: z.enum(["logo", "favicon", "heroBanner", "promo1", "promo2", "promo3"]),
});

async function requireSettingsAdmin() {
  const admin = await getSessionUser();
  if (!admin || !hasPermission(admin, "settings.manage")) return null;
  return admin;
}

export async function saveSiteCustomizerAction(config: unknown): Promise<ActionResult> {
  const admin = await requireSettingsAdmin();
  if (!admin) return { ok: false, message: "You are not authorised to change site settings." };

  const parsed = siteCustomizerSchema.safeParse(config);
  if (!parsed.success) {
    return { ok: false, message: `Some fields are invalid: ${parsed.error.issues[0]?.message ?? "check your input"}` };
  }

  const payload = { ...parsed.data, publishedAt: new Date().toISOString() };

  await prisma.$transaction([
    prisma.siteSetting.upsert({
      where: { key: SITE_CUSTOMIZER_KEY },
      update: {
        value: payload,
        description: "Published appearance, typography, content and branding from the visual editor",
      },
      create: {
        key: SITE_CUSTOMIZER_KEY,
        value: payload,
        description: "Published appearance, typography, content and branding from the visual editor",
      },
    }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: "SITE_CUSTOMIZER_PUBLISHED",
        targetType: "SITE_SETTING",
        targetId: SITE_CUSTOMIZER_KEY,
        details: {
          primary: payload.colors.primary,
          headingFont: payload.fonts.heading,
          heroTitle: payload.content.heroTitle,
        },
      },
    }),
  ]);

  // "layout" refreshes metadata, header, footer and every page at once.
  revalidatePath("/", "layout");
  revalidatePath("/admin/customizer");
  return { ok: true, message: "Changes published to the live site." };
}

export async function uploadCustomizerAssetAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireSettingsAdmin();
  if (!admin) return { ok: false, message: "You are not authorised to upload branding assets." };

  const parsedSlot = uploadSchema.safeParse({ slot: formData.get("slot") });
  if (!parsedSlot.success) return { ok: false, message: "Unknown upload slot." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image to upload." };
  }

  try {
    const stored = await storeImage(file, admin.id);
    return { ok: true, message: "Image uploaded. Save & publish to apply it.", url: stored.url };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Image upload failed." };
  }
}
