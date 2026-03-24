import type { MediaCategory, Prisma } from "@prisma/client";
import type { NaturalLanguageMixParse } from "@/lib/mix-media/types";
import type { MediaRecommendationItem } from "./types";

type MediaRow = {
  id: string;
  mediaName: string;
  category: MediaCategory;
  description: string | null;
  locationJson: Prisma.JsonValue;
  exposureJson: Prisma.JsonValue | null;
  price: number | null;
  cpm: number | null;
  tags: string[];
  audienceTags: string[];
};

function strFromJson(j: Prisma.JsonValue | null | undefined): string {
  if (!j || typeof j !== "object" || Array.isArray(j)) return "";
  const o = j as Record<string, unknown>;
  const parts = [o.address, o.district, o.map_link].filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0,
  );
  return parts.join(" ");
}

function dailyImpressions(exposureJson: Prisma.JsonValue | null | undefined): number {
  if (!exposureJson || typeof exposureJson !== "object" || Array.isArray(exposureJson)) {
    return 12_000;
  }
  const o = exposureJson as Record<string, unknown>;
  if (typeof o.daily_traffic === "number" && o.daily_traffic > 0) {
    return Math.round(o.daily_traffic);
  }
  if (typeof o.monthly_impressions === "number" && o.monthly_impressions > 0) {
    return Math.max(1, Math.round(o.monthly_impressions / 30));
  }
  return 12_000;
}

/** 주당 비용 추정 (원) */
function weeklyPriceKrw(m: MediaRow, daily: number): number {
  if (m.price != null && m.price > 0) {
    return m.price;
  }
  if (m.cpm != null && m.cpm > 0) {
    return Math.round((m.cpm * daily * 7) / 1000);
  }
  return 4_000_000;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

function locationScore(
  haystack: string,
  keywords: string[],
): number {
  if (keywords.length === 0) return 18;
  const h = haystack.toLowerCase();
  const hits = keywords.filter((k) => h.includes(k.toLowerCase())).length;
  return Math.min(40, 12 + (hits / keywords.length) * 28);
}

function budgetScore(totalCampaignKrw: number, budgetKrw: number): number {
  const soft = budgetKrw * 0.8;
  if (totalCampaignKrw <= soft) return 30;
  if (totalCampaignKrw <= budgetKrw) return 22;
  if (totalCampaignKrw <= budgetKrw * 1.15) return 12;
  const over = totalCampaignKrw - budgetKrw * 1.15;
  const pen = Math.min(12, over / Math.max(budgetKrw, 1) * 60);
  return Math.max(0, 8 - pen);
}

function impressionRankScore(daily: number, maxDaily: number): number {
  if (maxDaily <= 0) return 10;
  const r = Math.min(1, daily / maxDaily);
  return Math.round(6 + r * 14);
}

function keywordScore(brief: NaturalLanguageMixParse, m: MediaRow): number {
  const briefParts = [
    ...brief.audience_tags,
    ...brief.location_keywords,
    brief.style_notes,
    brief.target.lifestyle_notes ?? "",
    brief.goal,
  ]
    .join(" ")
    .split(/[\s,，、]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1);

  const briefSet = new Set(briefParts.map(normalize));
  const mediaTokens = [
    ...m.tags,
    ...m.audienceTags,
    m.category,
    m.mediaName,
  ]
    .join(" ")
    .split(/[\s,，、]+/)
    .map((x) => normalize(x.trim()))
    .filter(Boolean);

  if (briefSet.size === 0) return 5;
  let hit = 0;
  for (const t of mediaTokens) {
    for (const b of briefSet) {
      if (t.includes(b) || b.includes(t)) {
        hit++;
        break;
      }
    }
  }
  return Math.min(10, 3 + (hit / Math.max(mediaTokens.length, 1)) * 7);
}

function categoryBonus(brief: NaturalLanguageMixParse, cat: MediaCategory): number {
  const pref = brief.preferred_categories;
  if (!pref?.length) return 0;
  const idx = pref.indexOf(cat);
  if (idx === -1) return 0;
  return Math.max(0, 5 - idx);
}

/**
 * 위치 40% · 예산 30% · 노출 20% · 키워드 10% 휴리스틱 + 카테고리 소프트 보너스.
 */
export function scoreAndRankMedias(
  medias: MediaRow[],
  brief: NaturalLanguageMixParse,
  topN = 5,
): MediaRecommendationItem[] {
  if (medias.length === 0) return [];

  const maxDaily = Math.max(
    1,
    ...medias.map((m) => dailyImpressions(m.exposureJson)),
  );

  const scored = medias.map((m) => {
    const locStr = [
      strFromJson(m.locationJson),
      m.mediaName,
      m.description ?? "",
    ]
      .join(" ")
      .trim();

    const daily = dailyImpressions(m.exposureJson);
    const weekly = weeklyPriceKrw(m, daily);
    const totalCost = weekly * Math.max(1, brief.duration_weeks);

    const sLoc = locationScore(locStr, brief.location_keywords);
    const sBudget = budgetScore(totalCost, brief.budget_krw);
    const sImp = impressionRankScore(daily, maxDaily);
    const sKw = keywordScore(brief, m);
    const bonus = categoryBonus(brief, m.category);

    let raw = sLoc + sBudget + sImp + sKw + bonus;
    raw = Math.min(100, Math.round(raw));

    const matchFactor = raw / 100;
    const estimatedImpressions = Math.round(
      daily * 7 * Math.max(1, brief.duration_weeks) * (0.85 + 0.15 * matchFactor),
    );

    return {
      mediaId: m.id,
      name: m.mediaName,
      type: m.category,
      location: strFromJson(m.locationJson) || "위치 정보 없음",
      score: raw,
      estimatedImpressions,
      priceEstimate: totalCost,
      isMock: false,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}
