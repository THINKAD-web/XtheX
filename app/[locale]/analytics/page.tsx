import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import { landing } from "@/lib/landing-theme";
import { CampaignAnalyticsTool } from "@/components/analytics/CampaignAnalyticsTool";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "campaignAnalytics" });
  return {
    title: t("meta_title"),
    description: t("meta_description"),
    openGraph: {
      title: t("meta_title"),
      description: t("meta_description"),
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default async function CampaignAnalyticsPage() {
  return (
    <AppSiteChrome>
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className={`${landing.container} py-10 lg:py-14`}>
          <CampaignAnalyticsTool />
        </div>
      </main>
    </AppSiteChrome>
  );
}
