import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Hanya halaman publik yang boleh dirayapi: home.
// /cards, /r/*, dan API selalu noindex via metadata masing-masing.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/cards", "/r/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
