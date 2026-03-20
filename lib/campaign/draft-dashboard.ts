import { prisma } from "@/lib/prisma";
import { computePerformanceSummary } from "@/lib/campaign/performance";
import { getCampaignEventSummaryForDraft } from "@/lib/campaign/events";

export type DraftDashboardData = {
  draft: {
    id: string;
    name: string | null;
    channelDooh: boolean;
    channelWeb: boolean;
    channelMobile: boolean;
    mediaIds: string[];
    createdAt: string;
  };
  medias: Array<{
    id: string;
    mediaName: string;
    category: string;
    locationJson: any;
    price: number | null;
    cpm: number | null;
    trustScore: number | null;
    pros: string | null;
    exposureJson?: unknown;
  }>;
  performance: ReturnType<typeof computePerformanceSummary>;
  today: { leads: number; impressions: number; clicks: number; spend: number };
  deltas: {
    impressionsPct: number | null;
    clicksPct: number | null;
    cpmPct: number | null;
  };
  series7d: Array<{ date: string; leads: number; impressions: number; clicks: number; spend: number }>;
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

export async function getCampaignDraftDashboardData(
  draftId: string,
): Promise<DraftDashboardData | null> {
  const campaignDraft = (prisma as any).campaignDraft;
  if (!campaignDraft?.findUnique) return null;

  const d = await campaignDraft.findUnique({ where: { id: draftId } });
  if (!d) return null;
  const ids: string[] = Array.isArray(d.mediaIds) ? d.mediaIds : [];

  const medias = ids.length
    ? await prisma.media.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          mediaName: true,
          category: true,
          locationJson: true,
          price: true,
          cpm: true,
          trustScore: true,
          pros: true,
          exposureJson: true,
        },
      })
    : [];

  const performance = computePerformanceSummary(
    medias.map((m) => ({
      id: m.id,
      price: m.price,
      cpm: m.cpm,
      exposureJson: m.exposureJson,
    })),
  );

  const eventSummary = await getCampaignEventSummaryForDraft(draftId, { days: 7 });

  // leads: Inquiry counts for included media (today + last 7 days)
  const inquiryDelegate = (prisma as any).inquiry;
  const now = new Date();
  const todayStart = startOfDay(now);
  const since = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  const [todayLeads, last7d] = await Promise.all([
    typeof inquiryDelegate?.count === "function" && ids.length
      ? inquiryDelegate.count({
          where: { createdAt: { gte: todayStart }, mediaId: { in: ids } },
        })
      : Promise.resolve(0),
    typeof inquiryDelegate?.findMany === "function" && ids.length
      ? inquiryDelegate.findMany({
          where: { createdAt: { gte: since }, mediaId: { in: ids } },
          select: { createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const buckets = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    buckets.set(toYmd(day), 0);
  }
  for (const r of last7d as Array<{ createdAt: Date }>) {
    const key = toYmd(new Date(r.createdAt));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const todayKey = toYmd(todayStart);
  const yesterdayKey = toYmd(new Date(todayStart.getTime() - 24 * 60 * 60 * 1000));

  const todayEv = eventSummary.series.find((x) => x.date === todayKey) ?? {
    impressions: 0,
    clicks: 0,
    spend: 0,
  };
  const yesterdayEv = eventSummary.series.find((x) => x.date === yesterdayKey) ?? {
    impressions: 0,
    clicks: 0,
    spend: 0,
  };

  const todayCpm = todayEv.impressions > 0 ? (todayEv.spend / todayEv.impressions) * 1000 : null;
  const yesterdayCpm =
    yesterdayEv.impressions > 0 ? (yesterdayEv.spend / yesterdayEv.impressions) * 1000 : null;

  const pct = (todayVal: number, yestVal: number) => {
    if (!yestVal) return null;
    return ((todayVal - yestVal) / yestVal) * 100;
  };

  const impressionsPct = pct(todayEv.impressions, yesterdayEv.impressions ?? 0);
  const clicksPct = pct(todayEv.clicks, yesterdayEv.clicks ?? 0);
  const cpmPct =
    todayCpm != null && yesterdayCpm != null && yesterdayCpm > 0
      ? ((todayCpm - yesterdayCpm) / yesterdayCpm) * 100
      : null;

  return {
    draft: {
      id: d.id,
      name: d.name ?? null,
      channelDooh: d.channelDooh ?? true,
      channelWeb: d.channelWeb ?? false,
      channelMobile: d.channelMobile ?? false,
      mediaIds: ids,
      createdAt: new Date(d.createdAt).toISOString(),
    },
    medias: medias as any,
    performance,
    today: {
      leads: todayLeads,
      impressions: eventSummary.today.impressions,
      clicks: eventSummary.today.clicks,
      spend: eventSummary.today.spend,
    },
    series7d: Array.from(buckets.entries()).map(([date, leads]) => {
      const ev = eventSummary.series.find((x) => x.date === date);
      return {
        date,
        leads,
        impressions: ev?.impressions ?? 0,
        clicks: ev?.clicks ?? 0,
        spend: ev?.spend ?? 0,
      };
    }),
    deltas: {
      impressionsPct,
      clicksPct,
      cpmPct,
    },
  };
}

