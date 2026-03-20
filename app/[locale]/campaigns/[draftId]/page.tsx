import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCampaignDraftDashboardData } from "@/lib/campaign/draft-dashboard";
import { CampaignDraftDashboard } from "@/components/campaign/CampaignDraftDashboard";
import { LivePerformanceDashboardSection } from "@/components/campaign/LivePerformanceDashboardSection";

export const runtime = "nodejs";

export async function generateMetadata() {
  return {
    title: "Campaign | XtheX",
  };
}

export default async function CampaignDraftPage({
  params,
}: {
  params: Promise<{ locale: string; draftId: string }>;
}) {
  const { locale, draftId } = await params;
  const isKo = locale === "ko";
  const t = await getTranslations("dashboard.performance");

  const data = await getCampaignDraftDashboardData(draftId);
  if (!data) {
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-20 text-zinc-50">
        <div className="mx-auto max-w-3xl space-y-3">
          <h1 className="text-xl font-semibold">
            {isKo ? "캠페인 초안을 찾을 수 없습니다." : "Campaign draft not found."}
          </h1>
          <Link
            href={`/${locale}/dashboard/performance`}
            className="text-sm text-orange-400 hover:underline"
          >
            ← {t("title")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 pb-24 pt-20 text-zinc-50">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href={`/${locale}/dashboard/performance`}
          className="text-sm text-zinc-400 hover:text-orange-400"
        >
          ← {isKo ? "성과 예측" : "Performance"}
        </Link>

        <CampaignDraftDashboard
          locale={locale}
          draft={data.draft}
          medias={data.medias}
          performance={data.performance as any}
          today={data.today}
          series7d={data.series7d}
          deltas={data.deltas}
        />

        <LivePerformanceDashboardSection locale={locale} campaignDraftId={draftId} />
      </div>
    </div>
  );
}

