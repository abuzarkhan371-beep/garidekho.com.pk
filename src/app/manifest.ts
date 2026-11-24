import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { renderCustomizerText } from "@/lib/customizer/config";
import { getSiteCustomizer } from "@/lib/customizer/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const config = await getSiteCustomizer();
  const name = renderCustomizerText(config.content.siteName) || SITE_NAME;

  return {
    name: `${name} — Pakistan's automotive marketplace`,
    short_name: name,
    description: "Find cars for sale in Pakistan, compare price in Pakistan and sell verified cars, bikes and auto parts.",
    id: SITE_URL,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: config.colors.background,
    theme_color: config.colors.primary,
    lang: "en-PK",
    categories: ["shopping", "business", "lifestyle"],
    shortcuts: [
      { name: "Search vehicles", short_name: "Search", url: "/search" },
      { name: "Post an ad", short_name: "Sell", url: "/sell" },
      { name: "EMI calculator", short_name: "EMI", url: "/emi-calculator" },
    ],
    icons: [{ src: config.media.favicon || "/icon", sizes: "any", type: "image/png", purpose: "any" }],
  };
}
