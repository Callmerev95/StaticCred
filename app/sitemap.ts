import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Hanya home yang publik. Rute privat (/cards, /r/*) tidak masuk sitemap
// dan sudah noindex + disallow di robots.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl(),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
