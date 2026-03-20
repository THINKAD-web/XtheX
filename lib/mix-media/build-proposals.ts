/**
 * Prisma 후보 조회 + 스코어링 + 3~5개 미디어 믹스 조합.
 * 매체 점수: 타겟 40%, 비용효율(CPM) 30%, 리치 10%, 선호 카테고리 20%.
 * 조합 점수: 평균 매체 점수 + 카테고리 다양성 보너스 ~20%.
 */
import { prisma } from "@/lib/prisma";
import { MediaCategory, MediaStatus, Prisma } from "@prisma/client";
import type {
  MixMediaItem,
  MixProposal,
  MixProposalBreakdown,
  NaturalLanguageMixParse,
} from "./types";

function dailyImpressions(exposure: unknown): number {
  if (!exposure || typeof exposure !== "object") return 80_000;
  const o = exposure as Record<string, unknown>;
  const d = o.daily_traffic;
  if (typeof d === "number" && d > 0) return Math.min(d, 5_000_000);
  const s = String(d ?? "").replace(/[,，]/g, "");
  const m = s.match(/(\d[\d.]*)[\s만]*만?/);
  if (m) {
    const n = parseFloat(m[1].replace(/\./g, ""));
    return Math.min(Math.round(n * (s.includes("만") ? 10000 : 1)), 5_000_000);
  }
  const digits = s.match(/\d+/g);
  if (digits?.length) {
    const n = parseInt(digits.join("").slice(0, 8), 10);
    if (n > 100 && n < 100_000_000) return n;
  }
  return 80_000;
}

function coordsFromLocationJson(
  j: unknown,
): { lat: number; lng: number; address: string | null } | null {
  if (!j || typeof j !== "object") return null;
  const o = j as Record<string, unknown>;
  const lat = Number(o.lat);
  const lng = Number(o.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const addr = [o.address, o.district]
    .filter((x) => typeof x === "string" && x.trim())
    .join(" ")
    .trim();
  return { lat, lng, address: addr || null };
}

function toItem(m: {
  id: string;
  mediaName: string;
  category: MediaCategory;
  price: number | null;
  cpm: number | null;
  exposureJson: unknown;
  audienceTags: string[];
  locationJson: unknown;
}): MixMediaItem {
  const ll = coordsFromLocationJson(m.locationJson);
  return {
    id: m.id,
    mediaName: m.mediaName,
    category: m.category,
    price: m.price,
    cpm: m.cpm,
    daily_impressions_est: dailyImpressions(m.exposureJson),
    audienceTags: m.audienceTags ?? [],
    lat: ll?.lat ?? null,
    lng: ll?.lng ?? null,
    address: ll?.address ?? null,
  };
}

export function scoreMedia(
  m: MixMediaItem,
  parse: NaturalLanguageMixParse,
): number {
  const tags = new Set(parse.audience_tags);
  const overlap =
    m.audienceTags.filter((t) => tags.has(t)).length /
    Math.max(1, parse.audience_tags.length);
  const targetPart = tags.size ? overlap : 0.35;

  const cpm = m.cpm && m.cpm > 0 ? m.cpm : 15_000;
  const costEff = Math.min(1, 12_000 / cpm);

  const reachPart = Math.min(1, Math.log10(m.daily_impressions_est + 1) / 6);

  const pref = parse.preferred_categories;
  const catRank = pref.indexOf(m.category);
  const catPart =
    catRank === -1 ? 0.25 : 1 - catRank / Math.max(pref.length * 1.2, 1);

  return (
    targetPart * 0.4 +
    costEff * 0.3 +
    reachPart * 0.1 +
    catPart * 0.2
  );
}

function diversityScore(categories: MediaCategory[]): number {
  return new Set(categories).size / Math.max(categories.length, 1);
}

function monthsFactor(weeks: number): number {
  return Math.max(1, Math.ceil(weeks / 4));
}

function buildBreakdown(medias: MixMediaItem[]): MixProposalBreakdown[] {
  const by = new Map<MediaCategory, number>();
  for (const m of medias) {
    by.set(m.category, (by.get(m.category) ?? 0) + 1);
  }
  const n = medias.length;
  return Array.from(by.entries()).map(([category, count]) => ({
    category,
    count,
    pct: Math.round((count / n) * 1000) / 10,
  }));
}

function reasoningForCombo(
  medias: MixMediaItem[],
  parse: NaturalLanguageMixParse,
): string {
  const loc = parse.location_keywords.join("·") || "핵심 상권";
  const catKo: Record<string, string> = {
    DIGITAL_BOARD: "디지털",
    TRANSIT: "지하철·대중교통",
    BILLBOARD: "빌보드",
    STREET_FURNITURE: "가로시설",
    WALL: "벽면",
    ETC: "기타",
  };
  const cats = [...new Set(medias.map((m) => m.category))];
  const parts = cats.map((c) => catKo[c] ?? c).join(" + ");
  const goalKo =
    parse.goal === "traffic"
      ? "유동·트래픽"
      : parse.goal === "sales"
        ? "전환"
        : "브랜드 인지";
  return `${loc} 중심 ${parse.target.age_band ?? ""} 타겟, ${goalKo} 목표에 맞춰 ${parts} 믹스. CPM·노출·타겟 태그 적합도를 반영했습니다.`;
}

export async function fetchCandidateMedias(
  parse: NaturalLanguageMixParse,
): Promise<MixMediaItem[]> {
  const base: Prisma.MediaWhereInput = {
    status: MediaStatus.PUBLISHED,
    price: { not: null, gt: 0 },
  };

  const tryQuery = async (
    useAudience: boolean,
  ): Promise<
    {
      id: string;
      mediaName: string;
      category: MediaCategory;
      price: number | null;
      cpm: number | null;
      exposureJson: unknown;
      audienceTags: string[];
      locationJson: unknown;
    }[]
  > => {
    const and: Prisma.MediaWhereInput[] = [];
    if (useAudience && parse.audience_tags.length > 0) {
      and.push({ audienceTags: { hasSome: parse.audience_tags } });
    }
    if (parse.location_keywords.length > 0) {
      and.push({
        OR: parse.location_keywords.flatMap((kw) => [
          { mediaName: { contains: kw, mode: "insensitive" as const } },
          { description: { contains: kw, mode: "insensitive" as const } },
          { targetAudience: { contains: kw, mode: "insensitive" as const } },
        ]),
      });
    }
    const where = and.length > 0 ? { AND: [base, ...and] } : base;
    return prisma.media.findMany({
      where,
      take: 80,
      orderBy: [{ trustScore: "desc" }, { cpm: "asc" }],
      select: {
        id: true,
        mediaName: true,
        category: true,
        price: true,
        cpm: true,
        exposureJson: true,
        audienceTags: true,
        locationJson: true,
      },
    });
  };

  let rows = await tryQuery(true);
  if (rows.length < 8) {
    rows = await tryQuery(false);
  }
  if (rows.length < 4) {
    rows = await prisma.media.findMany({
      where: base,
      take: 40,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        mediaName: true,
        category: true,
        price: true,
        cpm: true,
        exposureJson: true,
        audienceTags: true,
        locationJson: true,
      },
    });
  }

  return rows.map(toItem);
}

function greedyCombo(
  candidates: MixMediaItem[],
  scoredOrder: MixMediaItem[],
  parse: NaturalLanguageMixParse,
  firstId: string | undefined,
  maxItems: number,
): MixMediaItem[] {
  const months = monthsFactor(parse.duration_weeks);
  const budget = parse.budget_krw;
  const out: MixMediaItem[] = [];
  let cost = 0;
  const used = new Set<string>();

  if (firstId) {
    const first = candidates.find((m) => m.id === firstId);
    if (first) {
      const add = (first.price ?? 0) * months;
      if (add > 0 && add <= budget) {
        out.push(first);
        cost += add;
        used.add(first.id);
      }
    }
  }

  for (const m of scoredOrder) {
    if (out.length >= maxItems) break;
    if (used.has(m.id)) continue;
    const add = (m.price ?? 0) * months;
    if (add <= 0 || cost + add > budget) continue;
    out.push(m);
    used.add(m.id);
    cost += add;
  }

  return out;
}

/** 마지막 매체를 다른 카테고리로 바꿔 다양성 개선 */
function tryDiversify(
  combo: MixMediaItem[],
  scoredOrder: MixMediaItem[],
  parse: NaturalLanguageMixParse,
): MixMediaItem[] {
  if (combo.length < 2) return combo;
  const months = monthsFactor(parse.duration_weeks);
  const budget = parse.budget_krw;
  if (diversityScore(combo.map((c) => c.category)) >= 0.67) return combo;

  const last = combo[combo.length - 1];
  const prefix = combo.slice(0, -1);
  const used = new Set(prefix.map((p) => p.id));
  const prefixCost = prefix.reduce(
    (s, m) => s + (m.price ?? 0) * months,
    0,
  );

  for (const m of scoredOrder) {
    if (used.has(m.id)) continue;
    if (m.category === last.category) continue;
    const newCost = prefixCost + (m.price ?? 0) * months;
    if (newCost <= budget) {
      return [...prefix, m];
    }
  }
  return combo;
}

export function buildMixProposals(
  candidates: MixMediaItem[],
  parse: NaturalLanguageMixParse,
): MixProposal[] {
  if (candidates.length === 0) return [];

  const months = monthsFactor(parse.duration_weeks);
  const scoredOrder = [...candidates].sort(
    (a, b) => scoreMedia(b, parse) - scoreMedia(a, parse),
  );

  const seeds: (string | undefined)[] = [
    scoredOrder[0]?.id,
    scoredOrder[1]?.id,
    scoredOrder[2]?.id,
    scoredOrder[4]?.id,
    scoredOrder[8]?.id,
    undefined,
  ];

  const proposals: MixProposal[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < seeds.length && proposals.length < 5; i++) {
    const maxItems = i % 2 === 0 ? 4 : 3;
    let combo = greedyCombo(
      candidates,
      scoredOrder,
      parse,
      seeds[i],
      maxItems,
    );
    if (combo.length < 3) {
      combo = greedyCombo(candidates, scoredOrder, parse, seeds[i], 3);
    }
    if (combo.length < 3) {
      combo = greedyCombo(candidates, scoredOrder, parse, undefined, 3);
    }
    combo = tryDiversify(combo, scoredOrder, parse);
    if (combo.length < 3) continue;

    const key = [...combo]
      .map((x) => x.id)
      .sort()
      .join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    const totalCost = combo.reduce(
      (s, m) => s + (m.price ?? 0) * months,
      0,
    );
    const reach = Math.round(
      combo.reduce(
        (s, m) =>
          s + m.daily_impressions_est * parse.duration_weeks * 0.55,
        0,
      ),
    );
    const comboScore =
      combo.reduce((s, m) => s + scoreMedia(m, parse), 0) / combo.length +
      diversityScore(combo.map((c) => c.category)) * 0.2;

    proposals.push({
      id: `mix-${proposals.length + 1}`,
      media_ids: combo.map((m) => m.id),
      medias: combo,
      total_cost_krw: totalCost,
      estimated_reach: reach,
      breakdown: buildBreakdown(combo),
      reasoning_ko: reasoningForCombo(combo, parse),
      score: comboScore,
    });
  }

  proposals.sort((a, b) => b.score - a.score);
  return proposals.slice(0, 5);
}
