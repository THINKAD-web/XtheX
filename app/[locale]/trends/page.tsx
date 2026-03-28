import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";

const RegionalTrendsClient = dynamic(() =>
  import("@/components/trends/RegionalTrendsClient").then((m) => m.RegionalTrendsClient),
);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("trends");
  return {
    title: t("meta_title"),
    description: t("meta_description"),
  };
}

export default function TrendsPage() {
  return (
    <AppSiteChrome>
      <RegionalTrendsClient />
    </AppSiteChrome>
  );
}
