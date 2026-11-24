import { z } from "zod";

/** Storage key used in the existing SiteSetting table. One JSON document = one publishable config. */
export const SITE_CUSTOMIZER_KEY = "site.customizer";

export const FONT_OPTIONS = [
  { label: "Plus Jakarta Sans", value: "Plus Jakarta Sans" },
  { label: "Inter", value: "Inter" },
  { label: "Manrope", value: "Manrope" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Poppins", value: "Poppins" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Work Sans", value: "Work Sans" },
  { label: "Nunito Sans", value: "Nunito Sans" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Lato", value: "Lato" },
  { label: "Merriweather", value: "Merriweather" },
  { label: "Playfair Display", value: "Playfair Display" },
] as const;

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Enter a 6-digit hex colour");
const mediaUrl = z.string().max(2048).refine(
  (value) => value === "" || value.startsWith("/") || value.startsWith("https://") || value.startsWith("http://"),
  "Use a full URL or a site-relative path",
);

export const promoBannerSchema = z.object({
  url: mediaUrl,
  href: z.string().max(500),
  alt: z.string().max(200),
});

const siteSettingsSchema = z.object({
  announcement: z.object({
    enabled: z.boolean().default(false),
    text: z.string().trim().max(240).default(""),
    href: z.string().trim().max(500).default(""),
    tone: z.enum(["info", "success", "warning"]).default("info"),
  }).prefault({}),
  maintenance: z.object({
    enabled: z.boolean().default(false),
    title: z.string().trim().min(2).max(120).default("We'll be right back"),
    message: z.string().trim().min(10).max(600).default(
      "Garidekho is undergoing scheduled maintenance. Please try again in a few minutes.",
    ),
    contactEmail: z.string().trim().max(120).default("support@garidekho.com.pk"),
  }).prefault({}),
  moderation: z.object({
    autoApprove: z.boolean().default(false),
  }).prefault({}),
}).prefault({});

export const siteCustomizerSchema = z.object({
  version: z.literal(1),
  publishedAt: z.string().nullable().optional(),
  colors: z.object({
    primary: hexColor,
    secondary: hexColor,
    accent: hexColor,
    background: hexColor,
    surface: hexColor,
    header: hexColor,
    footer: hexColor,
  }),
  fonts: z.object({
    heading: z.enum(FONT_OPTIONS.map((font) => font.value) as [string, ...string[]]),
    body: z.enum(FONT_OPTIONS.map((font) => font.value) as [string, ...string[]]),
    baseSize: z.number().int().min(14).max(20),
  }),
  content: z.object({
    siteName: z.string().trim().min(2).max(60),
    heroTitle: z.string().trim().min(2).max(160),
    heroAccent: z.string().trim().max(160),
    heroSubtitle: z.string().trim().min(10).max(600),
    searchPlaceholder: z.string().trim().min(3).max(160),
    searchButton: z.string().trim().min(3).max(60),
    ctaTitle: z.string().trim().min(3).max(120),
    ctaText: z.string().trim().min(10).max(600),
    ctaButton: z.string().trim().min(3).max(60),
    aboutTitle: z.string().trim().min(3).max(160),
    aboutText: z.string().trim().min(10).max(1200),
    copyright: z.string().trim().min(3).max(200),
    contactAddress: z.string().trim().max(200),
    contactPhone: z.string().trim().max(60),
    contactEmail: z.string().trim().max(120),
    footerAbout: z.string().trim().min(10).max(600),
  }),
  media: z.object({
    logo: mediaUrl,
    favicon: mediaUrl,
    heroBanner: mediaUrl,
    promoBanners: z.array(promoBannerSchema).max(3),
  }),
  settings: siteSettingsSchema,
});

export type SiteCustomizerConfig = z.infer<typeof siteCustomizerSchema>;

export const DEFAULT_CUSTOMIZER_CONFIG: SiteCustomizerConfig = {
  version: 1,
  publishedAt: null,
  colors: {
    primary: "#F97316",
    secondary: "#111827",
    accent: "#1677FF",
    background: "#F1F5F9",
    surface: "#FFFFFF",
    header: "#102A43",
    footer: "#102A43",
  },
  fonts: {
    heading: "Plus Jakarta Sans",
    body: "Inter",
    baseSize: 16,
  },
  content: {
    siteName: "Garidekho",
    heroTitle: "Your next ride is",
    heroAccent: "already here.",
    heroSubtitle:
      "Buy and sell verified cars for sale in Pakistan, bikes and auto parts. Compare price in Pakistan, explore real listings and connect with sellers you can trust — all in one place.",
    searchPlaceholder: "Try 'Corolla 2021', 'BYD electric', 'Alto'…",
    searchButton: "Search all listings",
    ctaTitle: "Sell your car in minutes",
    ctaText:
      "Take photos, add details, set your price and publish your used car for sale in Pakistan. Our guided wizard saves drafts automatically and walks you through every step.",
    ctaButton: "Post your ad",
    aboutTitle: "A marketplace built around trust",
    aboutText: "Every feature is designed to remove uncertainty from buying a car in Pakistan, from verified sellers to transparent pricing.",
    copyright: "© {{year}} Garidekho.com.pk. All rights reserved.",
    contactAddress: "Lahore · Karachi · Islamabad · Peshawar · Quetta",
    contactPhone: "0339 000 9 333",
    contactEmail: "support@garidekho.com.pk",
    footerAbout:
      "Trusted marketplace for cars for sale in Pakistan, used cars and auto parts — built for transparent deals and confident decisions.",
  },
  media: {
    logo: "",
    favicon: "",
    heroBanner:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=85",
    promoBanners: [],
  },
  settings: {
    announcement: {
      enabled: false,
      text: "",
      href: "",
      tone: "info",
    },
    maintenance: {
      enabled: false,
      title: "We'll be right back",
      message: "Garidekho is undergoing scheduled maintenance. Please try again in a few minutes.",
      contactEmail: "support@garidekho.com.pk",
    },
    moderation: {
      autoApprove: false,
    },
  },
};

/** Replaces safe template tokens used in editable copy. */
export function renderCustomizerText(value: string) {
  return value.replaceAll("{{year}}", String(new Date().getFullYear()));
}
