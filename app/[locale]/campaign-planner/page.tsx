import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";

const CampaignPlannerClient = dynamic(
  () =>
    import("@/components/campaign-planner/CampaignPlannerClient").then(
      (m) => m.CampaignPlannerClient,
    ),
);

export const metadata: Metadata = {
  title: "Campaign Planner | XtheX",
  description:
    "AI-powered campaign planner – get optimal outdoor media mix recommendations based on budget, target, and region.",
};

export default function CampaignPlannerPage() {
  return (
    <AppSiteChrome>
      <CampaignPlannerClient />
    </AppSiteChrome>
  );
}
