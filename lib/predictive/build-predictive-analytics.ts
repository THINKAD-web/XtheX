import type { MediaCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { loadUserTasteBundle, type TasteBundle } from "@/lib/recommend/personalized-engine";

/** 인앱 알림 중복 방지용 마커(거의 보이지 않는 문자로 감쌈) */
export const PREDICTIVE_NOTIFY_MARKER = "\u2060xthex_predictive_v1\u2060";

export type SeasonalMonthPoint = {
  month: number;
  label: string;
  demandIndex: number;
};

export type RegionalForecastRow = {
  code: string;
  sharePercent: number;
  userAffinity: number;
  seasonalNoteKey: string;
  blendedScore: number;
};

export type PredictivePick = {
  id: string;
  name: string;
  category: MediaCategory;
  country: string | null;
  score: number;
  reasonKeys: string[];
};

export type PredictiveAnalyticsPayload = {
  generatedAt: string;
  history: {
    wishlistCount: number;
    inquiryCount: number;
    campaignCount: number;
    hasStrongSignal: boolean;
  };
  seasonal: {
    hemisphereHint: "north" | "south";
    months: SeasonalMonthPoint[];
    currentMonthDemand: number;
  };
  regional: RegionalForecastRow[];
  picks: PredictivePick[];
};

/** 북반구 기준 옥외/디지털 OOH 수요 휴리스틱 (1=1월 … 12=12월) */
const NORTH_DEMAND = [0.94, 0.95, 1.02, 1.05, 1.08, 1.06, 1.0, 0.99, 1.04, 1.09, 1.12, 1.14];

const CATEGORY_SEASON: Partial<Record<MediaCategory, number[]>> = {
  DIGITAL_BOARD: [1.02, 1.02, 1.0, 1.0, 1.03, 1.04, 1.05, 1.04, 1.0, 1.02, 1.08, 1.1],
  BILLBOARD: [0.98, 0.98, 1.02, 1.04, 1.06, 1.05, 1.0, 1.0, 1.03, 1.06, 1.1, 1.12],
  TRANSIT: [1.0, 1.0, 1.02, 1.05, 1.04, 1.03, 1.06, 1.05, 1.02, 1.04, 1.06, 1.08],
};

const SOUTH_HEMISPHERE_CODES = new Set(["AU", "NZ", "ZA", "AR", "CL", "BR"]);

function topWeightedCategory(bundle: TasteBundle): MediaCategory | null {
  let best: MediaCategory | null = null;
  let w = 0;
  for (const [cat, n] of bundle.categories) {
    if (n > w) {
      w = n;
      best = cat as MediaCategory;
    }
  }
  return best;
}

function monthLabel(m: number, locale: string): string {
  try {
    return new Date(2000, m - 1, 1).toLocaleString(locale, { month: "short" });
  } catch {
    return String(m);
  }
}

function seasonalNoteKeyForCountry(code: string, month: number): string {
  const c = code.toUpperCase();
  if (["AU", "NZ", "ZA", "AR", "CL", "BR"].includes(c)) {
    const idx = (month + 5) % 12;
    const v = NORTH_DEMAND[idx] ?? 1;
    return v >= 1.06 ? "high" : v <= 0.97 ? "low" : "mid";
  }
  const v = NORTH_DEMAND[month - 1] ?? 1;
  return v >= 1.08 ? "high" : v <= 0.96 ? "low" : "mid";
}

export async function buildPredictiveAnalytics(
  userId: string,
  locale: string,
): Promise<PredictiveAnalyticsPayload> {
  const now = new Date();
  const month = now.getMonth() + 1;

  const [bundle, wlCount, inqCount, campCount, platformCountries] = await Promise.all([
    loadUserTasteBundle(userId),
    prisma.wishlist.count({ where: { userId } }),
    prisma.inquiry.count({ where: { advertiserId: userId } }),
    prisma.campaign.count({ where: { userId } }),
    prisma.media.groupBy({
      by: ["globalCountryCode"],
      where: {
        status: "PUBLISHED",
        globalCountryCode: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { globalCountryCode: "desc" } },
      take: 14,
    }),
  ]);

  const prefersSouth = [...bundle.countries].some((c) => SOUTH_HEMISPHERE_CODES.has(c));
  const demandCurve = prefersSouth
    ? NORTH_DEMAND.map((_, i) => NORTH_DEMAND[(i + 6) % 12]!)
    : NORTH_DEMAND;

  const months: SeasonalMonthPoint[] = demandCurve.map((demandIndex, i) => ({
    month: i + 1,
    label: monthLabel(i + 1, locale),
    demandIndex: Math.round(demandIndex * 100) / 100,
  }));

  const userCountryWeights = new Map<string, number>();
  for (const c of bundle.countries) {
    userCountryWeights.set(c, (userCountryWeights.get(c) ?? 0) + 3);
  }
  for (const row of platformCountries) {
    const code = row.globalCountryCode?.trim().toUpperCase();
    if (!code) continue;
    userCountryWeights.set(code, (userCountryWeights.get(code) ?? 0) + Math.min(2, Math.log10(row._count._all + 1)));
  }

  const totalW = [...userCountryWeights.values()].reduce((a, b) => a + b, 0) || 1;
  const regional: RegionalForecastRow[] = [...userCountryWeights.entries()]
    .map(([code, w]) => {
      const sharePercent = Math.round((w / totalW) * 1000) / 10;
      const userAffinity = bundle.countries.has(code) ? Math.min(100, w * 8) : Math.min(80, w * 5);
      const seasonalNoteKey = seasonalNoteKeyForCountry(code, month);
      const demand = NORTH_DEMAND[month - 1] ?? 1;
      const blendedScore = Math.round((sharePercent * 0.4 + userAffinity * 0.35 + demand * 25) * 10) / 10;
      return { code, sharePercent, userAffinity, seasonalNoteKey, blendedScore };
    })
    .sort((a, b) => b.blendedScore - a.blendedScore)
    .slice(0, 10);

  const medias = await prisma.media.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ viewCount: "desc" }, { updatedAt: "desc" }],
    take: 120,
    select: {
      id: true,
      mediaName: true,
      category: true,
      globalCountryCode: true,
      aiMatchScore: true,
      trustScore: true,
      viewCount: true,
    },
  });

  const topCat = topWeightedCategory(bundle);
  const catSeason =
    (topCat && CATEGORY_SEASON[topCat]) ? CATEGORY_SEASON[topCat]! : demandCurve;

  const picks: PredictivePick[] = medias
    .map((m) => {
      const cc = m.globalCountryCode?.trim().toUpperCase() ?? "";
      let score =
        (m.aiMatchScore ?? 50) * 0.35 +
        (m.trustScore ?? 50) * 0.25 +
        Math.log10((m.viewCount ?? 0) + 1) * 18;
      const reasonKeys: string[] = [];
      if (cc && bundle.countries.has(cc)) {
        score += 28;
        reasonKeys.push("history_region");
      }
      if (bundle.categories.has(m.category)) {
        score += 12 + Math.min(18, (bundle.categories.get(m.category) ?? 0) * 2);
        reasonKeys.push("history_category");
      }
      const sidx = month - 1;
      const catBoost = (catSeason[sidx] ?? demandCurve[sidx] ?? 1) / 1.02;
      score *= catBoost;
      if (catBoost >= 1.04) reasonKeys.push("seasonal_tailwind");
      if (reasonKeys.length === 0) reasonKeys.push("platform_momentum");
      return {
        id: m.id,
        name: m.mediaName,
        category: m.category,
        country: m.globalCountryCode,
        score: Math.round(score * 10) / 10,
        reasonKeys: [...new Set(reasonKeys)],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return {
    generatedAt: now.toISOString(),
    history: {
      wishlistCount: wlCount,
      inquiryCount: inqCount,
      campaignCount: campCount,
      hasStrongSignal: bundle.hasStrongSignal,
    },
    seasonal: {
      hemisphereHint: prefersSouth ? "south" : "north",
      months,
      currentMonthDemand: demandCurve[month - 1] ?? 1,
    },
    regional,
    picks,
  };
}
