/**
 * 매체별 추천 타겟팅 태그 (기존 Tag.code 풀 사용).
 * DB 변경 없이 매체명/카테고리 키워드로 매핑. 프로그램매틱/타겟팅 강화용.
 */
const MEDIA_KEYWORD_TO_TAGS: { keywords: string[]; tagCodes: string[] }[] = [
  {
    keywords: ["강남", "강남역", "gangnam"],
    tagCodes: ["gangnam_station", "office_workers", "high_income", "morning_rush", "evening_rush"],
  },
  {
    keywords: ["코엑스", "coex", "삼성"],
    tagCodes: ["coex", "office_workers", "high_income", "evening_rush"],
  },
  {
    keywords: ["여의도", "yeouido", "금융"],
    tagCodes: ["yeouido", "office_workers", "high_income", "morning_rush", "evening_rush"],
  },
  {
    keywords: ["홍대", "hongdae", "맹동"],
    tagCodes: ["evening_rush", "office_workers"],
  },
  {
    keywords: ["서울역", "seoul", "KTX", "역"],
    tagCodes: ["morning_rush", "evening_rush", "office_workers"],
  },
  {
    keywords: ["LED", "디지털"],
    tagCodes: ["morning_rush", "evening_rush"],
  },
  {
    keywords: ["빌보드", "billboard"],
    tagCodes: ["office_workers", "evening_rush"],
  },
];

/** 매체 id/이름/카테고리로 추천 태그 코드 목록 반환 (중복 제거, 최대 6개) */
export function getRecommendedTagCodesForMedia(
  mediaName: string,
  category: string,
): string[] {
  const combined = `${mediaName} ${category}`.toLowerCase();
  const codes = new Set<string>();

  for (const { keywords, tagCodes } of MEDIA_KEYWORD_TO_TAGS) {
    if (keywords.some((k) => combined.includes(k.toLowerCase()))) {
      tagCodes.forEach((c) => codes.add(c));
    }
  }

  // 기본값: 직장인·출퇴근은 대부분 매체에 적합
  if (codes.size === 0) {
    codes.add("office_workers");
    codes.add("morning_rush");
    codes.add("evening_rush");
  }

  return Array.from(codes).slice(0, 6);
}
