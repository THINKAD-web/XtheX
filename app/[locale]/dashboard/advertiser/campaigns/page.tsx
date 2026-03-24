import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { AdvertiserCampaignsSection } from "../advertiser-campaigns-section";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

function CampaignsTableSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Campaigns loading">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80"
          />
        ))}
      </div>
      <div className="h-[320px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/80" />
    </div>
  );
}

export default async function AdvertiserCampaignsPage({
  searchParams,
}: PageProps) {
  await gateAdvertiserDashboard();
  const t = await getTranslations("dashboard.advertiser");

  return (
    <DashboardChrome>
      <div className={`${landing.container} space-y-8 py-10 lg:space-y-10 lg:py-14`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard/advertiser"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-sky-400"
            >
              ← {t("back_hub")}
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
              {t("campaigns_page_title")}
            </h1>
            <p className="mt-3 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 lg:text-lg">
              {t("campaigns_page_subtitle")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/campaigns/new" className={landing.btnPrimary}>
              {t("quick_new_campaign")}
            </Link>
          </div>
        </div>

        <Suspense fallback={<CampaignsTableSkeleton />}>
          <AdvertiserCampaignsSection
            searchParams={searchParams}
            listBasePath="/dashboard/advertiser/campaigns"
          />
        </Suspense>
      </div>
    </DashboardChrome>
  );
}
