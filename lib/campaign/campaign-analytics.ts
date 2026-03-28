import { prisma } from "@/lib/prisma";

export type CampaignAnalyticsDaily = {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  roiPercent: number | null;
};

export type CampaignAnalyticsMediaRow = {
  mediaId: string;
  name: string;
  impressions: number;
  clicks: number;
  spend: number;
};

export type CampaignAnalyticsResult = {
  daily: CampaignAnalyticsDaily[];
  totals: {
    impressions: number;
    clicks: number;
    spend: number;
    ctr: number;
    roiPercent: number | null;
  };
  byMedia: CampaignAnalyticsMediaRow[];
  regions: { code: string; label: string }[];
  medias: { id: string; name: string }[];
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

function normalizeMediaIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
}

/** live-performance.ts와 동일한 수익 프록시 (KRW) */
function revenueProxy(impressions: number, clicks: number) {
  return clicks * 120 + impressions * 0.02;
}

function roiPercent(impressions: number, clicks: number, spend: number): number | null {
  if (spend <= 0) return null;
  const rev = revenueProxy(impressions, clicks);
  return Math.round((((rev - spend) / spend) * 100) * 100) / 100;
}

export type CampaignAnalyticsInput = {
  userId: string;
  from: Date;
  to: Date;
  region: string;
  mediaId: string | null;
};

export async function getCampaignAnalytics(
  input: CampaignAnalyticsInput,
): Promise<CampaignAnalyticsResult> {
  const from = startOfDay(input.from);
  const to = startOfDay(input.to);
  if (to < from) {
    return {
      daily: [],
      totals: {
        impressions: 0,
        clicks: 0,
        spend: 0,
        ctr: 0,
        roiPercent: null,
      },
      byMedia: [],
      regions: [{ code: "all", label: "all" }],
      medias: [],
    };
  }

  const drafts = await prisma.campaignDraft.findMany({
    where: { userId: input.userId },
    select: { id: true, mediaIds: true, name: true },
  });

  const allIds = [...new Set(drafts.flatMap((d) => normalizeMediaIds(d.mediaIds)))];
  const medias =
    allIds.length > 0
      ? await prisma.media.findMany({
          where: { id: { in: allIds } },
          select: {
            id: true,
            mediaName: true,
            globalCountryCode: true,
            locationJson: true,
          },
        })
      : [];

  const mediaMap = new Map(medias.map((m) => [m.id, m]));

  const regionCodes = new Set<string>();
  for (const m of medias) {
    if (m.globalCountryCode?.trim()) regionCodes.add(m.globalCountryCode.trim().toUpperCase());
  }
  const regions = [
    { code: "all", label: "all" },
    ...[...regionCodes].sort().map((code) => ({ code, label: code })),
  ];

  const mediasOptions = medias
    .map((m) => ({ id: m.id, name: m.mediaName }))
    .sort((a, b) => a.name.localeCompare(b.name));

  function draftMatches(d: (typeof drafts)[0]): boolean {
    const ids = normalizeMediaIds(d.mediaIds);
    if (input.mediaId && !ids.includes(input.mediaId)) return false;
    if (input.region !== "all") {
      const ok = ids.some(
        (mid) => mediaMap.get(mid)?.globalCountryCode?.toUpperCase() === input.region.toUpperCase(),
      );
      if (!ok) return false;
    }
    return true;
  }

  const draftIds = drafts.filter(draftMatches).map((d) => d.id);

  const rows =
    draftIds.length > 0
      ? await prisma.campaignEvent.findMany({
          where: {
            campaignDraftId: { in: draftIds },
            occurredAt: { gte: from, lte: new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1) },
          },
          select: {
            campaignDraftId: true,
            occurredAt: true,
            impressions: true,
            clicks: true,
            spend: true,
          },
        })
      : [];

  const dayMs = 24 * 60 * 60 * 1000;
  const dayKeys: string[] = [];
  for (let t = from.getTime(); t <= to.getTime(); t += dayMs) {
    dayKeys.push(toYmd(new Date(t)));
  }
  const dailyBuckets = new Map<string, { impressions: number; clicks: number; spend: number }>();
  for (const k of dayKeys) {
    dailyBuckets.set(k, { impressions: 0, clicks: 0, spend: 0 });
  }

  const mediaBuckets = new Map<string, { impressions: number; clicks: number; spend: number }>();

  for (const r of rows) {
    const did = r.campaignDraftId;
    if (!did) continue;
    const key = toYmd(new Date(r.occurredAt));
    const b = dailyBuckets.get(key);
    const imp = r.impressions ?? 0;
    const clk = r.clicks ?? 0;
    const sp = r.spend ?? 0;
    if (b) {
      b.impressions += imp;
      b.clicks += clk;
      b.spend += sp;
    }

    const draft = drafts.find((x) => x.id === did);
    const mids = draft ? normalizeMediaIds(draft.mediaIds) : [];
    const n = Math.max(1, mids.length);
    if (input.mediaId) {
      if (!mids.includes(input.mediaId)) continue;
      const mb = mediaBuckets.get(input.mediaId) ?? { impressions: 0, clicks: 0, spend: 0 };
      mb.impressions += imp;
      mb.clicks += clk;
      mb.spend += sp;
      mediaBuckets.set(input.mediaId, mb);
    } else {
      const shareImp = imp / n;
      const shareClk = clk / n;
      const shareSp = sp / n;
      for (const mid of mids) {
        const mb = mediaBuckets.get(mid) ?? { impressions: 0, clicks: 0, spend: 0 };
        mb.impressions += shareImp;
        mb.clicks += shareClk;
        mb.spend += shareSp;
        mediaBuckets.set(mid, mb);
      }
    }
  }

  const daily: CampaignAnalyticsDaily[] = dayKeys.map((date) => {
    const v = dailyBuckets.get(date) ?? { impressions: 0, clicks: 0, spend: 0 };
    const ctr = v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0;
    return {
      date,
      impressions: Math.round(v.impressions),
      clicks: Math.round(v.clicks),
      spend: Math.round(v.spend),
      ctr: Math.round(ctr * 100) / 100,
      roiPercent: roiPercent(v.impressions, v.clicks, v.spend),
    };
  });

  const ti = daily.reduce((s, d) => s + d.impressions, 0);
  const tc = daily.reduce((s, d) => s + d.clicks, 0);
  const ts = daily.reduce((s, d) => s + d.spend, 0);
  const totalsCtr = ti > 0 ? Math.round((tc / ti) * 10_000) / 100 : 0;

  const byMedia: CampaignAnalyticsMediaRow[] = [...mediaBuckets.entries()]
    .map(([mediaId, v]) => ({
      mediaId,
      name: mediaMap.get(mediaId)?.mediaName ?? mediaId.slice(0, 8),
      impressions: Math.round(v.impressions),
      clicks: Math.round(v.clicks),
      spend: Math.round(v.spend),
    }))
    .filter((r) => r.impressions > 0 || r.clicks > 0 || r.spend > 0)
    .sort((a, b) => b.impressions - a.impressions);

  return {
    daily,
    totals: {
      impressions: ti,
      clicks: tc,
      spend: ts,
      ctr: totalsCtr,
      roiPercent: roiPercent(ti, tc, ts),
    },
    byMedia,
    regions,
    medias: mediasOptions,
  };
}
