/**
 * 룰베이스 추천 이유 문구 (가성비/신뢰도/예산별 조합).
 * DB 없이 Compare 페이지 데이터만 사용.
 */

type MediaLike = { mediaName: string; price?: number | null; trustScore?: number | null };

const LOCATION_KEYWORDS = ["강남", "여의도", "코엑스", "금융", "gangnam", "yeouido", "coex"];

function hasLocationKeyword(name: string): boolean {
  const lower = name.toLowerCase();
  return LOCATION_KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

export function getBestValueReason(media: MediaLike | null, locale: string): string {
  if (!media) return locale === "ko" ? "" : "";
  const isKo = locale === "ko";
  let text = isKo
    ? `${media.mediaName}은 비교 매체 중 최저가에 가깝습니다. 예산 효율을 중시할 때 추천합니다.`
    : `${media.mediaName} is among the lowest-priced in this comparison. Recommended for budget efficiency.`;
  if (hasLocationKeyword(media.mediaName)) {
    text += isKo
      ? " 금융·프리미엄 상권으로 고소득층 도달에 유리합니다."
      : " Strong for premium/finance audiences.";
  }
  return text;
}

export function getMostTrustedReason(media: MediaLike | null, locale: string): string {
  if (!media) return locale === "ko" ? "" : "";
  const isKo = locale === "ko";
  return isKo
    ? `${media.mediaName}은 신뢰도 점수가 가장 높습니다. 브랜드 안전성·품질을 중시할 때 추천합니다.`
    : `${media.mediaName} has the highest trust score. Recommended when brand safety and quality matter.`;
}

const BUDGET_TIER_30M = 30_000_000;
const BUDGET_TIER_100M = 100_000_000;

export function getBudgetRecommendation(
  budget: number,
  medias: MediaLike[],
  bestPrice: MediaLike | null,
  bestTrust: MediaLike | null,
  locale: string,
): string {
  const isKo = locale === "ko";
  const names = medias.map((m) => m.mediaName);

  if (budget < BUDGET_TIER_30M) {
    return bestPrice
      ? (isKo
          ? `이 예산에는 ${bestPrice.mediaName} 1개 집중 추천. 저예산으로 노출을 확보할 수 있습니다.`
          : `For this budget, focus on ${bestPrice.mediaName} for maximum reach at low cost.`)
      : (isKo
          ? "이 예산에는 비교 매체 중 최저가 1개 집중 추천합니다."
          : "For this budget, we recommend focusing on one lowest-cost media.");
  }

  if (budget < BUDGET_TIER_100M) {
    const combo = [bestPrice?.mediaName, bestTrust?.mediaName].filter(Boolean);
    const uniq = [...new Set(combo)];
    if (uniq.length >= 2) {
      return isKo
        ? `2~3개 매체 조합 추천: ${uniq.join(", ")}. 도달·빈도 분산으로 효과를 높일 수 있습니다.`
        : `Recommended combo: ${uniq.join(", ")}. Spread reach and frequency.`;
    }
    return isKo
      ? "2~3개 매체 조합으로 도달·빈도 분산 추천합니다."
      : "We recommend a 2–3 media mix for reach and frequency.";
  }

  return isKo
    ? `전체 ${names.length}개 매체 포트폴리오로 노출 극대화를 추천합니다. ${names.join(", ")}.`
    : `Recommend using all ${names.length} media for maximum exposure: ${names.join(", ")}.`;
}
