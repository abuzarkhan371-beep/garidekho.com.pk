import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import {
  DEFAULT_CUSTOMIZER_CONFIG,
  SITE_CUSTOMIZER_KEY,
  type SiteCustomizerConfig,
} from "./config";
import { configFromUnknown } from "./theme";

/** Cached per request; called from the root layout, page components and actions. */
export const getSiteCustomizer = cache(async (): Promise<SiteCustomizerConfig> => {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: SITE_CUSTOMIZER_KEY } });
    return setting ? configFromUnknown(setting.value) : DEFAULT_CUSTOMIZER_CONFIG;
  } catch {
    // A branding lookup must never take the whole marketplace down.
    return DEFAULT_CUSTOMIZER_CONFIG;
  }
});

/** Uncached read for publish/write paths that must see the latest saved value. */
export async function getAutoApproveEnabled(): Promise<boolean> {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: SITE_CUSTOMIZER_KEY },
      select: { value: true },
    });
    const config = setting ? configFromUnknown(setting.value) : DEFAULT_CUSTOMIZER_CONFIG;
    return config.settings.moderation.autoApprove;
  } catch {
    return DEFAULT_CUSTOMIZER_CONFIG.settings.moderation.autoApprove;
  }
}
