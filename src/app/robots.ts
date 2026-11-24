import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/my-ads",
          "/saved",
          "/messages",
          "/site-preview",
          "/maintenance",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
