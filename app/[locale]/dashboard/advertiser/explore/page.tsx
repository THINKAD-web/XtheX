import type { Metadata } from "next";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { ExploreExperience } from "@/components/explore/ExploreExperience";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Advertiser Explore | XtheX",
  description: "Explore and compare published media for your campaigns.",
  robots: { index: false, follow: false },
};

export default async function AdvertiserExplorePage() {
  await gateAdvertiserDashboard();

  return (
    <DashboardChrome>
      <ExploreExperience variant="dashboard" />
    </DashboardChrome>
  );
}
