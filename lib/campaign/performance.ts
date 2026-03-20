/**
 * Media 배열에서 성과 예측용 요약 통계를 계산합니다.
 */
export type MediaForPerformance = {
  id: string;
  price: number | null;
  cpm: number | null;
  exposureJson?: unknown;
};

export type PerformanceSummary = {
  mediaCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  avgCpm: number | null;
  totalMonthlyImpressions: number | null; // exposureJson.monthly_impressions 합산 (숫자만)
};

export function computePerformanceSummary(
  medias: MediaForPerformance[],
): PerformanceSummary {
  if (medias.length === 0) {
    return {
      mediaCount: 0,
      minPrice: null,
      maxPrice: null,
      avgCpm: null,
      totalMonthlyImpressions: null,
    };
  }

  const prices = medias.map((m) => m.price).filter((p): p is number => p != null);
  const cpms = medias.map((m) => m.cpm).filter((c): c is number => c != null);

  let totalImpressions: number | null = null;
  for (const m of medias) {
    const exp = m.exposureJson as { monthly_impressions?: string | number } | undefined;
    if (exp?.monthly_impressions != null) {
      const n = typeof exp.monthly_impressions === "string"
        ? parseInt(exp.monthly_impressions, 10)
        : exp.monthly_impressions;
      if (!Number.isNaN(n)) {
        totalImpressions = (totalImpressions ?? 0) + n;
      }
    }
  }

  return {
    mediaCount: medias.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    avgCpm: cpms.length ? Math.round(cpms.reduce((a, b) => a + b, 0) / cpms.length) : null,
    totalMonthlyImpressions: totalImpressions ?? null,
  };
}
