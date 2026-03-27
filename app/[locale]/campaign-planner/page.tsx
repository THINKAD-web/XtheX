import type { Metadata } from "next";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { CampaignPlannerClient } from "@/components/campaign-planner/CampaignPlannerClient";

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
