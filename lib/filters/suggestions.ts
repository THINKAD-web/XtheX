type RelatedMap = Record<string, string[]>;

// 태그 코드별로 함께 쓰면 좋은 태그 코드 리스트
export const RELATED_TAGS: RelatedMap = {
  // Gangnam combo: location + commute + 20~30s + high income
  gangnam_station: [
    "morning_rush",
    "evening_rush",
    "office_workers",
    "twenties",
    "thirties",
    "high_income",
    "luxury",
    "premium",
  ],
  coex: [
    "weekend",
    "families",
    "shopping_mall_visitors",
    "twenties",
    "thirties",
  ],
  yeouido: [
    "morning_rush",
    "evening_rush",
    "office_workers",
    "high_income",
    "premium",
  ],
  hongdae_trendy: ["evening_rush", "nightlife", "twenties", "teens", "couples"],

  morning_rush: ["office_workers", "twenties", "thirties"],
  evening_rush: ["office_workers", "couples", "dining_out"],

  high_income: ["luxury", "premium"],
  teens: ["gamers", "kpop", "ott"],
  twenties: ["kpop", "beauty", "fashion"],
};

export function getRelatedCodes(code: string): string[] {
  return RELATED_TAGS[code] ?? [];
}

