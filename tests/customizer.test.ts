import { describe, expect, it } from "vitest";
import {
  DEFAULT_CUSTOMIZER_CONFIG,
  siteCustomizerSchema,
} from "@/lib/customizer/config";

describe("site customizer moderation settings", () => {
  it("defaults auto-approve to off", () => {
    expect(DEFAULT_CUSTOMIZER_CONFIG.settings.moderation.autoApprove).toBe(false);
  });

  it("fills the setting for configs saved before it existed", () => {
    const legacy = structuredClone(DEFAULT_CUSTOMIZER_CONFIG) as Record<string, any>;
    delete legacy.settings.moderation;

    const parsed = siteCustomizerSchema.parse(legacy);
    expect(parsed.settings.moderation.autoApprove).toBe(false);
  });

  it("keeps an enabled auto-approve value", () => {
    const config = {
      ...DEFAULT_CUSTOMIZER_CONFIG,
      settings: {
        ...DEFAULT_CUSTOMIZER_CONFIG.settings,
        moderation: { autoApprove: true },
      },
    };

    expect(siteCustomizerSchema.parse(config).settings.moderation.autoApprove).toBe(true);
  });
});
