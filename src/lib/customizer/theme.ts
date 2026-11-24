import {
  DEFAULT_CUSTOMIZER_CONFIG,
  siteCustomizerSchema,
  type SiteCustomizerConfig,
} from "./config";

type Rgb = { r: number; g: number; b: number };
type Scale = Record<number, string>;

/**
 * Exact scales for the shipped design system. When an admin picks one of the
 * default colours we emit these hand-tuned values instead of a computed ramp,
 * so borders, text and focus states match the specification pixel-for-pixel.
 * Custom colours still use the computed ramp below.
 */
const EXACT_SCALES: Record<string, Scale> = {
  "neutral:#111827": {
    50: "#F1F5F9", 100: "#E2E8F0", 200: "#CBD5E1", 300: "#94A3B8",
    400: "#64748B", 500: "#64748B", 600: "#475569", 700: "#334155",
    800: "#1E293B", 900: "#111827", 950: "#102A43",
  },
  "brand:#f97316": {
    50: "#FFF7ED", 100: "#FFEDD5", 200: "#FED7AA", 300: "#FDBA74",
    400: "#FB923C", 500: "#F97316", 600: "#F97316", 700: "#EA580C",
    800: "#C2410C", 900: "#9A3412",
  },
  "signal:#1677ff": {
    50: "#EFF6FF", 100: "#DBEAFE", 200: "#BFDBFE", 300: "#93C5FD",
    400: "#60A5FA", 500: "#1677FF", 600: "#0B62E0", 700: "#0950B8",
  },
};

function exactScale(color: string, kind: "brand" | "neutral" | "signal") {
  return EXACT_SCALES[`${kind}:${color.toLowerCase()}`];
}

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb) {
  const part = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Blend `base` toward `target` by `amount` (0 = base, 1 = target). */
function blend(base: string, target: string, amount: number) {
  const a = hexToRgb(base);
  const b = hexToRgb(target);
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

function themeScale(color: string, kind: "brand" | "neutral" | "signal"): Scale {
  const exact = exactScale(color, kind);
  if (exact) return exact;

  const white = "#ffffff";
  const black = "#000000";
  if (kind === "brand") {
    return {
      50: blend(color, white, 0.94),
      100: blend(color, white, 0.86),
      200: blend(color, white, 0.72),
      300: blend(color, white, 0.52),
      400: blend(color, white, 0.28),
      500: blend(color, white, 0.12),
      600: color,
      700: blend(color, black, 0.14),
      800: blend(color, black, 0.28),
      900: blend(color, black, 0.42),
    };
  }
  if (kind === "neutral") {
    return {
      50: blend(color, white, 0.94),
      100: blend(color, white, 0.88),
      200: blend(color, white, 0.76),
      300: blend(color, white, 0.6),
      400: blend(color, white, 0.42),
      500: blend(color, white, 0.28),
      600: blend(color, white, 0.14),
      700: blend(color, black, 0.12),
      800: blend(color, black, 0.28),
      900: color,
      950: blend(color, black, 0.42),
    };
  }
  return {
    50: blend(color, white, 0.94),
    100: blend(color, white, 0.88),
    200: blend(color, white, 0.72),
    300: color,
    400: blend(color, black, 0.1),
    500: blend(color, black, 0.2),
    600: blend(color, black, 0.34),
    700: blend(color, black, 0.48),
  };
}

export function readableForeground(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance < 0.55 ? "#ffffff" : "#111827";
}

/**
 * Tailwind v4 emits @theme tokens as CSS custom properties and utilities reference
 * those variables. Overriding them at :root re-skins every component without
 * touching a single class name.
 */
export function buildThemeVariables(config: SiteCustomizerConfig): Record<string, string> {
  const teal = themeScale(config.colors.primary, "brand");
  const ink = themeScale(config.colors.secondary, "neutral");
  const signal = themeScale(config.colors.accent, "signal");

  const variables: Record<string, string> = {
    "--color-canvas": config.colors.background,
    "--color-surface": config.colors.surface,
    "--gdk-header": config.colors.header,
    "--gdk-footer": config.colors.footer,
    "--gdk-ink-950-base": ink[950] ?? config.colors.secondary,
    "--gdk-header-fg": readableForeground(config.colors.header),
    "--gdk-footer-fg": readableForeground(config.colors.footer),
    // Fixed semantic aliases used by links, selected states and primary CTAs.
    "--color-navy": "#102A43",
    "--color-link": "#1677FF",
    "--color-link-ink": "#0B62E0",
    "--color-link-soft": "#60A5FA",
    "--color-cta": "#F97316",
    "--color-cta-hover": "#EA580C",
    "--color-cta-ink": "#C2410C",
    "--font-body": `"${config.fonts.body}", ui-sans-serif, system-ui, sans-serif`,
    "--font-heading": `"${config.fonts.heading}", ui-sans-serif, system-ui, sans-serif`,
    "--gdk-base-size": `${config.fonts.baseSize}px`,
  };

  for (const [step, value] of Object.entries(teal)) variables[`--color-teal-${step}`] = value;
  for (const [step, value] of Object.entries(ink)) variables[`--color-ink-${step}`] = value;
  for (const [step, value] of Object.entries(signal)) variables[`--color-signal-${step}`] = value;

  return variables;
}

const SELF_HOSTED_FONTS = new Set(["Inter", "Plus Jakarta Sans"]);

/** Fonts selected in the editor that are not already self-hosted by next/font. */
export function getCustomFontLinks(config: SiteCustomizerConfig) {
  const families = [...new Set([config.fonts.heading, config.fonts.body])].filter(
    (family) => !SELF_HOSTED_FONTS.has(family),
  );
  if (families.length === 0) return [];
  const familyParam = families.map((family) => `family=${family.replaceAll(" ", "+")}:wght@400;500;600;700;800`).join("&");
  return [`https://fonts.googleapis.com/css2?${familyParam}&display=swap`];
}

export function variablesToCss(variables: Record<string, string>, important = false) {
  const suffix = important ? " !important" : "";
  return `:root{${Object.entries(variables).map(([key, value]) => `${key}:${value}${suffix}`).join(";")}}`;
}

/** Compact, URL-safe preview payload so unsaved drafts can be rendered in an iframe. */
export function encodePreviewConfig(config: SiteCustomizerConfig) {
  const bytes = new TextEncoder().encode(JSON.stringify(config));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodePreviewConfig(value: string | undefined): SiteCustomizerConfig | null {
  if (!value || value.length > 12000) return null;
  try {
    const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
    const json = atob(normalized);
    const parsed = siteCustomizerSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function configFromUnknown(value: unknown): SiteCustomizerConfig {
  const parsed = siteCustomizerSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_CUSTOMIZER_CONFIG;
}
