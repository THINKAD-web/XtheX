import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export type RealtimeTodayKpi = {
  impressions: number; // demo
  clicks: number; // demo
  leads: number; // inquiries today
  roi: number | null; // demo
};

export type RealtimeDailyPoint = {
  date: string; // YYYY-MM-DD
  leads: number;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function computeRealtimeMiniDashboardMetrics(): Promise<{
  today: RealtimeTodayKpi;
  series7d: RealtimeDailyPoint[];
}> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const since = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  const inquiryDelegate = (prisma as any).inquiry;

  const [todayLeads, last7d] = await Promise.all([
    typeof inquiryDelegate?.count === "function"
      ? inquiryDelegate.count({ where: { createdAt: { gte: todayStart } } })
      : Promise.resolve(0),
    typeof inquiryDelegate?.findMany === "function"
      ? inquiryDelegate.findMany({
          where: { createdAt: { gte: since } },
          select: { createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const buckets = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(toYmd(d), 0);
  }

  for (const r of last7d as Array<{ createdAt: Date }>) {
    const key = toYmd(new Date(r.createdAt));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const series7d = Array.from(buckets.entries()).map(([date, leads]) => ({
    date,
    leads,
  }));

  // Demo-only: impressions/clicks/roi without campaign events
  const today: RealtimeTodayKpi = {
    impressions: todayLeads * 12000, // assume 12k impressions per lead (demo)
    clicks: Math.round(todayLeads * 28), // assume 28 clicks per lead (demo)
    leads: todayLeads,
    roi: null,
  };

  return { today, series7d };
}

const realtimeMiniCached = unstable_cache(
  async () => computeRealtimeMiniDashboardMetrics(),
  ["xthex-realtime-mini-dashboard"],
  { revalidate: 60 },
);

/** 홈 미니 대시보드 — 60초 캐시로 Inquiry 집계 부하 완화 */
export async function getRealtimeMiniDashboardMetrics(): Promise<{
  today: RealtimeTodayKpi;
  series7d: RealtimeDailyPoint[];
}> {
  return realtimeMiniCached();
}

