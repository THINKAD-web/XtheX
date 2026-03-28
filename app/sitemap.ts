import { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://xthex.com");

const locales = ["ko", "en", "ja", "zh", "es"];
const staticPages = [
  "",
  "/explore",
  "/about",
  "/contact",
  "/terms",
  "/news",
  "/campaign-planner",
  "/help",
  "/developers",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1 : 0.8,
      });
    }
  }
  return entries;
}
