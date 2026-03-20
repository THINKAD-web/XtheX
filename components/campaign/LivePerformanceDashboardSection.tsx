import { getLivePerformanceMetrics } from "@/lib/campaign/live-performance";
import { LivePerformanceDashboard } from "@/components/campaign/LivePerformanceDashboard";

export async function LivePerformanceDashboardSection({
  locale,
  campaignDraftId,
}: {
  locale: string;
  campaignDraftId?: string;
}) {
  const { today, series } = await getLivePerformanceMetrics({
    campaignDraftId,
    days: 7,
  });

  return (
    <LivePerformanceDashboard
      locale={locale}
      titleKo={campaignDraftId ? "캠페인 Live Performance" : "전체 Live Performance"}
      titleEn={campaignDraftId ? "Campaign Live Performance" : "Global Live Performance"}
      today={today}
      series={series}
    />
  );
}

