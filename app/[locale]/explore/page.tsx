import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { ExploreClient } from "@/components/explore/explore-client";

export default async function ExplorePage() {
  return (
    <AppSiteChrome>
      <ExploreClient />
    </AppSiteChrome>
  );
}
