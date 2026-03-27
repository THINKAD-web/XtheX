import { MetadataRoute } from "next";

const BASE = "https://xthe-x.vercel.app";
const locales = ["ko", "en", "ja", "zh"];
const staticPages = ["", "/explore", "/about", "/contact", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: page === "" ? 1 : 0.8,
      });
    }
  }
  return entries;
}
