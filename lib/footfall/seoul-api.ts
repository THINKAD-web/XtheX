/**
 * Seoul Open Data — OA-14991 LOCAL_PEOPLE_DONG (server-side, SEOUL_DATA_API_KEY).
 */
import type { FootfallSuggestion } from "./types";
import { FOOTFALL_FALLBACK } from "./fallback-data";
import type { HotspotKey } from "./fallback-data";
import { SEONGSU_DONG2GA_CODE } from "./address-parser";

const SEOUL_OPEN_API_BASE = "http://openapi.seoul.go.kr:8088";
const SERVICE_NAME = "LOCAL_PEOPLE_DONG";

export { SEONGSU_DONG2GA_CODE };

type SeoulApiResponse = {
  LOCAL_PEOPLE_DONG?: {
    row?: Record<string, string | number | undefined>[];
  };
};

export const SEOUL_API_SOURCE_LABEL =
  "2026년 최근 서울시 생활인구 API 데이터 반영 (행정동 평균, data.seoul.go.kr)";

const COMMERCIAL_MULTIPLIER = 1.7;
const API_TIMEOUT_MS = 10_000;

function getRecentDateId(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export async function fetchSeoulLivingPopulation(
  dongCode: string,
): Promise<FootfallSuggestion | null> {
  const apiKey = process.env.SEOUL_DATA_API_KEY;
  if (!apiKey?.trim()) return null;

  const dateId = getRecentDateId();
  const url = `${SEOUL_OPEN_API_BASE}/${apiKey.trim()}/json/${SERVICE_NAME}/1/1000/${dateId}/${dongCode}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as SeoulApiResponse;
    const row = data?.LOCAL_PEOPLE_DONG?.row;
    if (!Array.isArray(row) || row.length === 0) return null;

    const values: number[] = [];
    for (const r of row) {
      const tot =
        r.TOT_LVPOP_CO ??
        (r["총생활인구수"] as string | undefined) ??
        (r["총_생활인구수"] as string | undefined);
      if (tot !== undefined && tot !== null && tot !== "" && tot !== "*") {
        const n = typeof tot === "string" ? parseFloat(tot) : Number(tot);
        if (Number.isFinite(n)) values.push(n);
      }
    }
    if (values.length === 0) return null;

    const avgPopulation = values.reduce((a, b) => a + b, 0) / values.length;
    const adjustedFootfall = Math.round(avgPopulation * COMMERCIAL_MULTIPLIER);

    return {
      footfall: adjustedFootfall,
      dailyImpressions: Math.round(adjustedFootfall * 10),
      reach: Math.round(adjustedFootfall * 0.5),
      frequency: 4.5,
      sourceLabel: SEOUL_API_SOURCE_LABEL,
      sourceUrl: "https://data.seoul.go.kr",
      isFallback: false,
    };
  } catch (e) {
    console.error("[fetchSeoulLivingPopulation]", e);
    return null;
  }
}

export async function getFootfallSuggestion(
  hotspotKey: HotspotKey | null,
): Promise<FootfallSuggestion> {
  const isSeongsu =
    hotspotKey === "seongsu_yeonmujang" ||
    hotspotKey === "seongsu_dong2ga" ||
    (typeof hotspotKey === "string" && hotspotKey.includes("seongsu"));

  if (isSeongsu) {
    const apiData = await fetchSeoulLivingPopulation(SEONGSU_DONG2GA_CODE);
    if (apiData) return apiData;
  }

  const fallbackKey = hotspotKey ?? "default_near_seongsu";
  return FOOTFALL_FALLBACK[fallbackKey];
}
