import type { MediaCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAdvertiserRecommendations } from "@/lib/recommend/get-advertiser-recommendations";
import type { RecommendationItem } from "@/lib/recommend/recommendations-ui-types";
import type { ExploreSearchSignal } from "@/lib/recommend/explore-search-signals";

export type PersonalizedRecoItem = RecommendationItem & {
  /** 툴팁·요약 한 줄 */
  personalizedReason: string;
  /** 툴팁 전체 근거 (여러 문단) */
  personalizedReasonDetail: string;
  contributorKeys: string[];
  modelVersion: string;
};

const MODEL_VERSION = "xthex-rank-v1"; // 가중 임베딩 + 협업 필터 스타일 스코어링

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 80);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) {
    if (b.has(x)) inter += 1;
  }
  const union = a.size + b.size - inter;
  return union > 0 ? inter / union : 0;
}

function asObj(v: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function mediaTokens(tags: string[], audienceTags: string[], locationJson: unknown): Set<string> {
  const loc = asObj(locationJson as Prisma.JsonValue);
  const addr =
    [loc?.address, loc?.district]
      .filter((x) => typeof x === "string")
      .join(" ") ?? "";
  const all = [...tags, ...audienceTags, addr];
  return new Set(tokenize(all.join(" ")));
}

function extractCampaignMediaIds(mix: unknown, omni: unknown): string[] {
  const out: string[] = [];
  if (mix && typeof mix === "object" && !Array.isArray(mix)) {
    const m = mix as Record<string, unknown>;
    const ids = m.media_ids;
    if (Array.isArray(ids)) {
      for (const x of ids) {
        if (typeof x === "string" && x.length > 10) out.push(x);
      }
    }
  }
  if (Array.isArray(omni)) {
    for (const x of omni) {
      if (typeof x === "string" && x.length > 10) out.push(x);
    }
  }
  return [...new Set(out)];
}

function contributorMessages(
  keys: string[],
  locale: string,
): { lines: string[]; summary: string } {
  const isKo = locale.startsWith("ko");
  const isJa = locale.startsWith("ja");
  const isZh = locale.startsWith("zh");
  const map: Record<string, { ko: string; en: string; ja: string; zh: string }> = {
    search_keywords: {
      ko: "최근 매체 검색·필터 키워드와 텍스트 유사도가 높습니다.",
      en: "Matches keywords from your recent media search filters.",
      ja: "最近の検索・フィルター語句との一致度が高いです。",
      zh: "与您最近的搜索和筛选关键词高度相关。",
    },
    campaign_location: {
      ko: "저장된 캠페인의 지역·타겟 요약과 궤적이 맞습니다.",
      en: "Aligned with regions and targets from your saved campaigns.",
      ja: "保存キャンペーンの地域・ターゲット要約と整合します。",
      zh: "与您保存的活动的地区和目标摘要一致。",
    },
    wishlist_category: {
      ko: "찜한 매체와 유사한 카테고리·오디언스 패턴입니다.",
      en: "Similar category and audience pattern to your wishlist.",
      ja: "お気に入り媒体に近いカテゴリ・オーディエンス傾向です。",
      zh: "与您收藏的媒体类别和受众模式相似。",
    },
    inquiry_audience: {
      ko: "문의한 매체와 유사한 노출 특성을 보입니다.",
      en: "Exposure profile similar to media you inquired about.",
      ja: "問い合わせ済み媒体に近い露出特性です。",
      zh: "与您咨询过的媒体曝光特征相似。",
    },
    similar_recent: {
      ko: "최근 본 매체와 같은 카테고리·지역 성향입니다.",
      en: "Same category and area tendency as recently viewed media.",
      ja: "最近閲覧した媒体と同系のカテゴリ・エリア傾向です。",
      zh: "与您最近浏览的媒体类别和地区倾向一致。",
    },
    ml_global: {
      ko: "플랫폼 전역 신뢰도·AI 적합도 기반 랭킹이 반영되었습니다.",
      en: "Global trust and AI-fit signals from the platform are blended in.",
      ja: "プラットフォーム全体の信頼度・AI適合スコアを反映しています。",
      zh: "融合了平台全局信任度与AI匹配信号。",
    },
  };
  const lines = keys.map((k) => {
    const row = map[k] ?? map.ml_global;
    if (isKo) return row.ko;
    if (isJa) return row.ja;
    if (isZh) return row.zh;
    return row.en;
  });
  const summary = lines[0] ?? (isKo ? "맞춤 랭킹으로 선별했습니다." : "Ranked with our personalization model.");
  return { lines, summary };
}

export async function computePersonalizedRecommendations(args: {
  userId: string | null;
  locale: string;
  searchSignals: ExploreSearchSignal[];
  clientDismissedIds: string[];
  clientRecentlyViewedIds: string[];
}): Promise<PersonalizedRecoItem[]> {
  const base = await getAdvertiserRecommendations();
  if (base.length === 0) return [];

  const dismissedServer = args.userId
    ? (
        await prisma.recommendationDismissal.findMany({
          where: { userId: args.userId },
          select: { mediaId: true },
        })
      ).map((r) => r.mediaId)
    : [];

  const dismissed = new Set([...dismissedServer, ...args.clientDismissedIds]);

  const ids = base.map((b) => b.id).filter((id) => !dismissed.has(id));
  if (ids.length === 0) return [];

  const [metaRows, userBundle] = await Promise.all([
    prisma.media.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        category: true,
        tags: true,
        audienceTags: true,
        locationJson: true,
        globalCountryCode: true,
      },
    }),
    args.userId
      ? loadUserTasteBundle(args.userId)
      : Promise.resolve(emptyTaste()),
  ]);

  const meta = new Map(metaRows.map((m) => [m.id, m]));

  const userTokens = new Set<string>();
  const userCategories = new Map<string, number>();
  const userCountries = new Set<string>();

  for (const t of userBundle.tokens) userTokens.add(t);
  for (const [c, w] of userBundle.categories) {
    userCategories.set(c, (userCategories.get(c) ?? 0) + w);
  }
  for (const c of userBundle.countries) userCountries.add(c);

  for (const sig of args.searchSignals) {
    tokenize([sig.q, sig.district].filter(Boolean).join(" ")).forEach((x) => userTokens.add(x));
    if (sig.mediaType && sig.mediaType !== "ALL") {
      userCategories.set(sig.mediaType, (userCategories.get(sig.mediaType) ?? 0) + 2);
    }
  }

  const recentMeta =
    args.clientRecentlyViewedIds.length > 0
      ? await prisma.media.findMany({
          where: { id: { in: args.clientRecentlyViewedIds.slice(0, 12) } },
          select: { category: true, globalCountryCode: true },
        })
      : [];
  const recentCats = new Set(recentMeta.map((m) => m.category));
  const recentCountries = new Set(
    recentMeta.map((m) => m.globalCountryCode?.trim().toUpperCase()).filter(Boolean) as string[],
  );

  const scored = base
    .filter((b) => !dismissed.has(b.id))
    .map((item) => {
      const m = meta.get(item.id);
      if (!m) {
        return { item, score: item.aiMatchScore * 0.2, keys: ["ml_global"] as string[] };
      }

      const mTokens = mediaTokens(m.tags, m.audienceTags, m.locationJson);
      const textJ = jaccard(userTokens, mTokens);
      const catW = userCategories.get(m.category) ?? 0;
      const catScore = clamp(catW * 4, 0, 24);
      const cc = m.globalCountryCode?.trim().toUpperCase() ?? "";
      const countryHit =
        (cc && userCountries.has(cc) ? 14 : 0) + (cc && recentCountries.has(cc) ? 6 : 0);
      const recentCatBonus = recentCats.has(m.category) ? 10 : 0;
      const baseAi = item.aiMatchScore * 0.22;

      const score =
        textJ * 38 + catScore + countryHit + recentCatBonus + baseAi + (userBundle.hasStrongSignal ? 0 : 3);

      const keys: string[] = [];
      if (textJ >= 0.04 && userTokens.size >= 2) keys.push("search_keywords");
      if (userBundle.campaignTextWeight > 0 && textJ >= 0.02) keys.push("campaign_location");
      if (userBundle.wishlistCategoryHits.has(m.category)) keys.push("wishlist_category");
      if (userBundle.inquiryCategoryHits.has(m.category)) keys.push("inquiry_audience");
      if (recentCatBonus > 0) keys.push("similar_recent");
      if (keys.length === 0) keys.push("ml_global");

      return { item, score, keys: [...new Set(keys)] };
    });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);

  return top.map(({ item, keys }) => {
    const { lines, summary } = contributorMessages(keys, args.locale);
    return {
      ...item,
      personalizedReason: summary,
      personalizedReasonDetail: lines.join("\n\n"),
      contributorKeys: keys,
      modelVersion: MODEL_VERSION,
    };
  });
}

type TasteBundle = {
  tokens: Set<string>;
  categories: Map<string, number>;
  countries: Set<string>;
  campaignTextWeight: number;
  wishlistCategoryHits: Set<MediaCategory>;
  inquiryCategoryHits: Set<MediaCategory>;
  hasStrongSignal: boolean;
};

function emptyTaste(): TasteBundle {
  return {
    tokens: new Set(),
    categories: new Map(),
    countries: new Set(),
    campaignTextWeight: 0,
    wishlistCategoryHits: new Set(),
    inquiryCategoryHits: new Set(),
    hasStrongSignal: false,
  };
}

async function loadUserTasteBundle(userId: string): Promise<TasteBundle> {
  const bundle = emptyTaste();
  const [campaigns, wishlists, inquiries] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: { location_summary: true, target_summary: true, mediaMix: true, omniMediaIds: true },
    }),
    prisma.wishlist.findMany({
      where: { userId },
      take: 30,
      include: {
        media: { select: { category: true, tags: true, audienceTags: true, globalCountryCode: true } },
      },
    }),
    prisma.inquiry.findMany({
      where: { advertiserId: userId },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        media: { select: { category: true, tags: true, audienceTags: true, globalCountryCode: true } },
      },
    }),
  ]);

  for (const c of campaigns) {
    const blob = [c.location_summary, c.target_summary].join(" ");
    tokenize(blob).forEach((t) => bundle.tokens.add(t));
    if (blob.trim().length > 3) bundle.campaignTextWeight += 1;
    const mids = extractCampaignMediaIds(c.mediaMix, c.omniMediaIds);
    if (mids.length > 0) {
      const refs = await prisma.media.findMany({
        where: { id: { in: mids.slice(0, 40) } },
        select: { category: true, tags: true, audienceTags: true, globalCountryCode: true },
      });
      for (const r of refs) {
        bundle.categories.set(r.category, (bundle.categories.get(r.category) ?? 0) + 2);
        tokenize([...r.tags, ...r.audienceTags].join(" ")).forEach((t) => bundle.tokens.add(t));
        const cc = r.globalCountryCode?.trim().toUpperCase();
        if (cc) bundle.countries.add(cc);
      }
    }
  }

  for (const w of wishlists) {
    bundle.wishlistCategoryHits.add(w.media.category);
    bundle.categories.set(w.media.category, (bundle.categories.get(w.media.category) ?? 0) + 3);
    tokenize([...w.media.tags, ...w.media.audienceTags].join(" ")).forEach((t) => bundle.tokens.add(t));
    const cc = w.media.globalCountryCode?.trim().toUpperCase();
    if (cc) bundle.countries.add(cc);
  }

  for (const q of inquiries) {
    bundle.inquiryCategoryHits.add(q.media.category);
    bundle.categories.set(q.media.category, (bundle.categories.get(q.media.category) ?? 0) + 2);
    tokenize([...q.media.tags, ...q.media.audienceTags].join(" ")).forEach((t) => bundle.tokens.add(t));
    const cc = q.media.globalCountryCode?.trim().toUpperCase();
    if (cc) bundle.countries.add(cc);
  }

  bundle.hasStrongSignal =
    bundle.tokens.size >= 4 ||
    bundle.categories.size >= 1 ||
    campaigns.length > 0 ||
    wishlists.length > 0 ||
    inquiries.length > 0;

  return bundle;
}
