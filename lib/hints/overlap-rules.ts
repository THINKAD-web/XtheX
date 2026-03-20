export type OverlapRule = {
  id: string;
  tags: [string, string];
  overlap: number; // 0~1
  messageKo: string;
  messageEn: string;
};

export const OVERLAP_RULES: OverlapRule[] = [
  {
    id: "twenties_college",
    tags: ["twenties", "college_students"],
    overlap: 0.8,
    messageKo:
      "20대 + 대학생: 약 80% 이상 겹치는 세그먼트입니다. 하나만 사용해도 충분할 수 있어요.",
    messageEn:
      "20s + college students: >80% overlapping segment. Using just one may be sufficient.",
  },
  {
    id: "office_morning",
    tags: ["office_workers", "morning_rush"],
    overlap: 0.7,
    messageKo:
      "직장인 + 출근시간: 동일 출근 동선에서 크게 겹치는 타겟입니다. 메시지를 한 번 더 정리해보세요.",
    messageEn:
      "Office workers + morning rush: large overlap on commute routes. Consider simplifying your targeting.",
  },
  {
    id: "office_evening",
    tags: ["office_workers", "evening_rush"],
    overlap: 0.7,
    messageKo:
      "직장인 + 퇴근시간: 퇴근 동선 기준으로 겹치는 타겟입니다. 예산 효율을 위해 태그를 줄여도 좋습니다.",
    messageEn:
      "Office workers + evening rush: overlapping along evening commute. Fewer tags can improve budget efficiency.",
  },
];

export function getOverlapWarnings(tagCodes: string[]) {
  const set = new Set((tagCodes ?? []).filter(Boolean));
  return OVERLAP_RULES.filter((r) => r.tags.every((t) => set.has(t)));
}

