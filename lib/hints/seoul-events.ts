export type SeoulEvent = {
  id: string;
  nameKo: string;
  nameEn: string;
  /** Inclusive start date (YYYY-MM-DD, Asia/Seoul assumed) */
  start: string;
  /** Inclusive end date (YYYY-MM-DD, Asia/Seoul assumed) */
  end: string;
  /** Optional venue/area hint */
  areaKo?: string;
  areaEn?: string;
  /** Expected lift percent (demo) */
  boostPercent?: number; // default 30
  /** Which filter tags should trigger surfacing this event */
  triggerTagCodes: string[];
  /** Message shown in alert */
  boostKo: string;
  boostEn: string;
};

// Hardcoded “calendar” (demo). Add/adjust dates as needed.
export const SEOUL_EVENTS_CALENDAR: SeoulEvent[] = [
  {
    id: "seoul_cherry_blossom",
    nameKo: "여의도 벚꽃축제(시즌)",
    nameEn: "Yeouido Cherry Blossom Festival (season)",
    start: "2026-03-20",
    end: "2026-04-10",
    areaKo: "여의도/한강",
    areaEn: "Yeouido/Han River",
    triggerTagCodes: ["spring_festival", "date_spot", "hongdae_trendy", "gangnam_station"],
    boostKo:
      "유동/데이트 수요가 올라가는 시즌이라 ‘근처/오늘’ 메시지와 지도/거리 요소를 넣으면 반응이 좋아져요.",
    boostEn:
      "Foot traffic increases in this season—use “nearby/today” copy with distance/map cues for better response.",
  },
  {
    id: "seoul_rainy_week",
    nameKo: "장마/우천 컨텍스트(데모)",
    nameEn: "Rainy context (demo)",
    start: "2026-06-20",
    end: "2026-07-25",
    areaKo: "서울 전역",
    areaEn: "All Seoul",
    triggerTagCodes: ["rainy_day"],
    boostKo:
      "비 오는 날엔 우산/보호/따뜻함 키워드가 컨텍스트 매칭이 좋아요. ‘우산 챙기세요’ 같은 한 줄 카피를 추천합니다.",
    boostEn:
      "Rain boosts context-match for umbrella/protection/comfort cues. Try a one-liner like “Don’t forget your umbrella”.",
  },
  {
    id: "seoul_fireworks_hanriver",
    nameKo: "한강 불꽃 이벤트(시즌)",
    nameEn: "Han River fireworks (season)",
    start: "2026-10-01",
    end: "2026-10-15",
    areaKo: "한강/여의도",
    areaEn: "Han River/Yeouido",
    triggerTagCodes: ["nightlife", "date_spot", "hongdae_trendy", "evening_rush"],
    boostKo:
      "야간 체류 시간이 늘어 ‘저녁/지금’ 타이밍 메시지 + 즉시 혜택(쿠폰/QR) 조합이 특히 좋아요.",
    boostEn:
      "Longer evening dwell time—pair “tonight/now” timing copy with instant incentives (coupon/QR).",
  },
];

function toYmdSeoul(d: Date) {
  // Convert to Asia/Seoul day without importing heavy TZ libs:
  // approximate by shifting UTC by +9h and taking YYYY-MM-DD.
  const ms = d.getTime() + 9 * 60 * 60 * 1000;
  const x = new Date(ms);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, "0");
  const day = String(x.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inRangeYmd(today: string, start: string, end: string) {
  return today >= start && today <= end;
}

export function getActiveSeoulEvents(tagCodes: string[], now = new Date()) {
  const today = toYmdSeoul(now);
  const set = new Set((tagCodes ?? []).filter(Boolean));

  return SEOUL_EVENTS_CALENDAR.filter((ev) => {
    if (!inRangeYmd(today, ev.start, ev.end)) return false;
    return ev.triggerTagCodes.some((c) => set.has(c));
  });
}

