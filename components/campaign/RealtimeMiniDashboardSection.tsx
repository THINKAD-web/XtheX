import { getRealtimeMiniDashboardMetrics } from "@/lib/campaign/realtime-metrics";
import { RealtimeMiniDashboard } from "@/components/campaign/RealtimeMiniDashboard";

export async function RealtimeMiniDashboardSection({ locale }: { locale: string }) {
  const { today, series7d } = await getRealtimeMiniDashboardMetrics();
  return <RealtimeMiniDashboard locale={locale} today={today} series7d={series7d} />;
}

