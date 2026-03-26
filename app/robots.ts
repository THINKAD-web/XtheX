import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://xthex.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/explore", "/medias/"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/campaigns/",
          "/*/admin/",
          "/*/dashboard/",
          "/*/campaigns/",
          "/*/onboarding/",
          "/api/",
          "/auth/",
          "/onboarding/",
        ],
      },
    ],
    sitemap: `${appUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}

