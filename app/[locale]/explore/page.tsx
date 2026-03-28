import type { Metadata } from "next";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { ExploreClient } from "@/components/explore/explore-client";
import { RecentlyViewedSection } from "@/components/medias/RecentlyViewedSection";

export const metadata: Metadata = {
  title: "Explore Media | XtheX",
  description:
    "Browse published outdoor ad media with filters, list/map view, and inquiry flow.",
};

export default async function ExplorePage() {
  return (
    <AppSiteChrome>
      <RecentlyViewedSection className="border-b border-border" />
      <ExploreClient />
    </AppSiteChrome>
  );
}
