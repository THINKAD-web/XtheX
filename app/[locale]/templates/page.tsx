import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";

const CampaignTemplatesLibrary = dynamic(() =>
  import("@/components/campaign-templates/CampaignTemplatesLibrary").then((m) => m.CampaignTemplatesLibrary),
);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("campaign_templates");
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default function TemplatesPage() {
  return (
    <AppSiteChrome>
      <CampaignTemplatesLibrary />
    </AppSiteChrome>
  );
}
