import type { FootfallSuggestion } from "./types";

export type HotspotKey =
  | "seongsu_yeonmujang"
  | "seongsu_dong2ga"
  | "gangnam_main"
  | "hongdae_main"
  | "default_near_seongsu";

export const FOOTFALL_FALLBACK: Record<HotspotKey, FootfallSuggestion> = {
  seongsu_yeonmujang: {
    footfall: 70_000,
    dailyImpressions: 800_000,
    reach: 35_000,
    frequency: 4.5,
    sourceLabel:
      "2025-2026 성수 연무장길 메인 상권 추정치 (쿠시먼 보고서 + 서울시 데이터 기반)",
    sourceUrl: "https://data.seoul.go.kr",
    isFallback: true,
  },
  seongsu_dong2ga: {
    footfall: 120_000,
    dailyImpressions: 1_200_000,
    reach: 45_000,
    frequency: 5,
    sourceLabel: "2025 성수동2가 일대 추정 (보고서 ~268k 광역 기준 보수적 적용)",
    sourceUrl: "https://data.seoul.go.kr",
    isFallback: true,
  },
  gangnam_main: {
    footfall: 100_000,
    dailyImpressions: 1_000_000,
    reach: 42_000,
    frequency: 4,
    sourceLabel: "2025-2026 강남 메인 상권 추정치",
    isFallback: true,
  },
  hongdae_main: {
    footfall: 85_000,
    dailyImpressions: 650_000,
    reach: 38_000,
    frequency: 4.5,
    sourceLabel: "2025-2026 홍대 메인 상권 추정치",
    isFallback: true,
  },
  default_near_seongsu: {
    footfall: 65_000,
    dailyImpressions: 600_000,
    reach: 28_000,
    frequency: 4,
    sourceLabel: "근처 상권(성수 메인) 기준으로 제안됨",
    sourceUrl: "https://data.seoul.go.kr",
    isFallback: true,
  },
};
