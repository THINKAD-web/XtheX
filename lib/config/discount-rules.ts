/**
 * 패키지 할인 기본 룰
 * 나중에 admin UI에서 수정 가능하도록 설계된 구조
 */
export const DEFAULT_DISCOUNT_RULES = [
  { minCount: 3, rate: 0.05, label: "기본 패키지 할인" },
  { minCount: 5, rate: 0.1, label: "프리미엄 패키지 할인" },
  { minCount: 7, rate: 0.15, label: "VIP 패키지 할인" },
] as const;

/**
 * 선택된 매체 개수에 따라 적용 가능한 가장 높은 할인율 반환
 */
export function getApplicableDiscountRate(count: number): number {
  for (const rule of [...DEFAULT_DISCOUNT_RULES].reverse()) {
    if (count >= rule.minCount) {
      return rule.rate;
    }
  }
  return 0;
}

/**
 * 할인율에 맞는 라벨 반환 (UI에 표시용)
 */
export function getDiscountLabel(rate: number): string {
  const rule = DEFAULT_DISCOUNT_RULES.find((r) => r.rate === rate);
  return rule ? rule.label : "할인 없음";
}
