import { unstable_cache } from "next/cache";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export type LiveTodayKpi = {
  impressions: number;
  clicks: number;
  spend: number;
  cpm: number | null;
  roi: number | null;
};

export type LiveDailyPoint = {
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  spend: number;
  cpm: number | null;
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

function demoLivePerformanceMetrics(days: number): {
  today: LiveTodayKpi;
  series: LiveDailyPoint[];
} {
  const series = Array.from({ length: days }).map((_, i) => {
    const d = startOfDay(new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000));
    const imp = 1200 + i * 180;
    const clk = 28 + i * 4;
    const spend = 45000 + i * 6000;
    return {
      date: toYmd(d),
      impressions: imp,
      clicks: clk,
      spend,
      cpm: imp > 0 ? (spend / imp) * 1000 : null,
    };
  });
  return {
    today: {
      impressions: 12450,
      clicks: 342,
      spend: 890000,
      cpm: 71.5,
      roi: 2.1,
    },
    series,
  };
}

async function _getLivePerformanceMetrics(input?: {
  campaignDraftId?: string;
  days?: number;
}): Promise<{ today: LiveTodayKpi; series: LiveDailyPoint[] }> {
  const days = Math.max(1, Math.min(30, input?.days ?? 7));
  const now = new Date();
  const todayStart = startOfDay(now);
  const since = startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));

  if (!isDatabaseConfigured()) {
    return demoLivePerformanceMetrics(days);
  }

  try {
    const delegate = (prisma as any).campaignEvent;
    if (!delegate?.findMany) {
      const series = Array.from({ length: days }).map((_, i) => {
        const d = startOfDay(new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000));
        return { date: toYmd(d), impressions: 0, clicks: 0, spend: 0, cpm: null };
      });
      return {
        today: { impressions: 0, clicks: 0, spend: 0, cpm: null, roi: null },
        series,
      };
    }

    const where: Record<string, unknown> = {
      occurredAt: { gte: since },
    };
    if (input?.campaignDraftId) where.campaignDraftId = input.campaignDraftId;

    const rows = await delegate.findMany({
      where,
      select: { occurredAt: true, impressions: true, clicks: true, spend: true },
    });

    const buckets = new Map<string, { impressions: number; clicks: number; spend: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      buckets.set(toYmd(d), { impressions: 0, clicks: 0, spend: 0 });
    }
    for (const r of rows as Array<{
      occurredAt: Date;
      impressions: number;
      clicks: number;
      spend: number;
    }>) {
      const key = toYmd(new Date(r.occurredAt));
      const b = buckets.get(key);
      if (!b) continue;
      b.impressions += r.impressions ?? 0;
      b.clicks += r.clicks ?? 0;
      b.spend += r.spend ?? 0;
    }

    const todayKey = toYmd(todayStart);
    const todayRaw = buckets.get(todayKey) ?? { impressions: 0, clicks: 0, spend: 0 };
    const cpm =
      todayRaw.impressions > 0 ? (todayRaw.spend / todayRaw.impressions) * 1000 : null;

    const revenue = todayRaw.clicks * 120 + todayRaw.impressions * 0.02;
    const roi = todayRaw.spend > 0 ? (revenue - todayRaw.spend) / todayRaw.spend : null;

    const series = Array.from(buckets.entries()).map(([date, v]) => ({
      date,
      impressions: v.impressions,
      clicks: v.clicks,
      spend: v.spend,
      cpm: v.impressions > 0 ? (v.spend / v.impressions) * 1000 : null,
    }));
    return {
      today: {
        impressions: todayRaw.impressions,
        clicks: todayRaw.clicks,
        spend: todayRaw.spend,
        cpm,
        roi,
      },
      series,
    };
  } catch {
    return demoLivePerformanceMetrics(days);
  }
}

export const getLivePerformanceMetrics = unstable_cache(
  async (input?: { campaignDraftId?: string; days?: number }) => _getLivePerformanceMetrics(input),
  ["xthex:live-performance:v1"],
  { revalidate: 300 },
);

