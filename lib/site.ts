// URL kanonis situs untuk metadata SEO (OG, canonical, sitemap).
// Satu sumber agar konsisten di layout, robots, dan sitemap.

export const SITE_NAME = "StaticCred";

export const SITE_TAGLINE =
  "Cetak kartu ajakan review Google dan TripAdvisor siap cetak 300 DPI langsung dari browser.";

export function siteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (raw) return raw.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://static-cred.vercel.app";
}
