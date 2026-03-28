import type { Metadata } from "next";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { ExploreClient } from "@/components/explore/explore-client";
import { RecentlyViewedSection } from "@/components/medias/RecentlyViewedSection";

export const metadata: Metadata = {
  title: "Explore Media | XtheX",
  description:
    "Browse published outdoor ad media with filters, list/map view, and inquiry flow.",
  openGraph: {
    title: "Explore Media | XtheX",
    description: "Browse published outdoor ad media with filters, list/map view, and inquiry flow.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default async function ExplorePage() {
  return (
    <AppSiteChrome>
      <RecentlyViewedSection className="border-b border-border" />
      <ExploreClient />
    </AppSiteChrome>
  );
}
