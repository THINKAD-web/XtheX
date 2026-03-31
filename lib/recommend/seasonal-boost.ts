/**
 * 달력 기반 소매·이벤트 시즌 가중치 (휴리스틱).
 * UTC 기준 — 지역별 공휴일 API 연동 시 확장 가능.
 */
export function getSeasonalRecommendationBoost(now = new Date()): {
  bonus: number;
  key: string | null;
} {
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();

  // 블랙프라이데이 전후 (미국 소매 시즌 프록시)
  if (m === 11 && d >= 20 && d <= 30) {
    return { bonus: 10, key: "seasonal_black_friday" };
  }
  // 연말 쇼핑
  if (m === 12 && d >= 10 && d <= 31) {
    return { bonus: 8, key: "seasonal_year_end" };
  }
  // 설·춘절 대략 구간 (1/15–2/15)
  if ((m === 1 && d >= 15) || (m === 2 && d <= 15)) {
    return { bonus: 9, key: "seasonal_lunar_peak" };
  }
  // 여름 성수기 OOH
  if (m >= 6 && m <= 8) {
    return { bonus: 4, key: "seasonal_summer" };
  }

  return { bonus: 0, key: null };
}
