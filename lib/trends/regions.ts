/** Stable ids — match `trends.regions.{id}` in messages */
export const TREND_REGION_IDS = [
  "seoul",
  "tokyo",
  "nyc",
  "shanghai",
  "london",
  "dubai",
] as const;

export type TrendRegionId = (typeof TREND_REGION_IDS)[number];

export type TrendRegionPoint = {
  id: TrendRegionId;
  lat: number;
  lng: number;
};

export const TREND_REGION_POINTS: TrendRegionPoint[] = [
  { id: "seoul", lat: 37.5665, lng: 126.978 },
  { id: "tokyo", lat: 35.6762, lng: 139.6503 },
  { id: "nyc", lat: 40.7128, lng: -74.006 },
  { id: "shanghai", lat: 31.2304, lng: 121.4737 },
  { id: "london", lat: 51.5074, lng: -0.1278 },
  { id: "dubai", lat: 25.2048, lng: 55.2708 },
];

/** Demo stats (KRW, weekly reference budget) */
export const TREND_REGION_STATS: Record<TrendRegionId, { avgBudgetKrw: number; yoyPct: number }> = {
  seoul: { avgBudgetKrw: 3_800_000, yoyPct: 12 },
  tokyo: { avgBudgetKrw: 4_200_000, yoyPct: 9 },
  nyc: { avgBudgetKrw: 5_600_000, yoyPct: 7 },
  shanghai: { avgBudgetKrw: 4_900_000, yoyPct: 14 },
  london: { avgBudgetKrw: 5_100_000, yoyPct: 6 },
  dubai: { avgBudgetKrw: 6_200_000, yoyPct: 18 },
};
