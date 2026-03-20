import { getOmniMediaCategory } from "./category";
import type { OmniCartItem } from "./types";
import type { OmniMediaCategory } from "./types";

type MediaLike = { id: string; mediaName: string; category: string };

function categoriesInMix(medias: MediaLike[]): Set<OmniMediaCategory> {
  const s = new Set<OmniMediaCategory>();
  for (const m of medias) {
    s.add(
      getOmniMediaCategory({
        id: m.id,
        mediaName: m.mediaName,
        category: m.category,
        priceMin: null,
        priceMax: null,
      } as OmniCartItem),
    );
  }
  return s;
}

function countByCat(medias: MediaLike[], cats: OmniMediaCategory[]): number {
  let n = 0;
  for (const m of medias) {
    const k = getOmniMediaCategory({
      id: m.id,
      mediaName: m.mediaName,
      category: m.category,
      priceMin: null,
      priceMax: null,
    } as OmniCartItem);
    if (cats.includes(k)) n++;
  }
  return n;
}

/**
 * 캠페인 상세 옴니채널용: 매체 조합 기반 3단계 타임라인 문구 + 바 세그먼트 비율.
 */
export function buildOmniCampaignDetailPhases(medias: MediaLike[]): {
  segments: { flex: number; className: string }[];
  lines: [string, string, string];
} {
  const cats = categoriesInMix(medias);
  const n = Math.max(medias.length, 1);

  const hasLarge = cats.has("BILLBOARD") || cats.has("WALL");
  const hasDigital = cats.has("DIGITAL_BOARD");
  const hasTransit = cats.has("TRANSIT");
  const hasStreet = cats.has("STREET_FURNITURE");

  const line1 = hasLarge
    ? "1주차: 인지도 → 대형 매체"
    : hasDigital
      ? "1주차: 인지도 → 디지털 고빈도 노출"
      : "1주차: 인지도 → 다채널 브랜딩";

  const line2 = hasDigital
    ? "2주차: 관심 유도 → 디지털"
    : hasLarge
      ? "2주차: 관심 유도 → 빌보드·온라인 연계"
      : hasStreet
        ? "2주차: 관심 유도 → 근접·가로 매체"
        : "2주차: 관심 유도 → 온·오프 믹스";

  const line3 = hasTransit
    ? "3~4주차: 행동 → 이동형"
    : hasStreet
      ? "3~4주차: 행동 → 가로·근접 노출"
      : hasDigital && !hasTransit
        ? "3~4주차: 행동 → 디지털 전환"
        : "3~4주차: 행동 → 옴니 터치포인트";

  const c1 = countByCat(medias, ["BILLBOARD", "WALL"]);
  const c2 = countByCat(medias, ["DIGITAL_BOARD"]);
  const c3 = countByCat(medias, ["TRANSIT", "STREET_FURNITURE"]);
  const f1 = 0.85 + (c1 / n) * 0.5 + (hasLarge ? 0.2 : 0);
  const f2 = 0.85 + (c2 / n) * 0.45 + (hasDigital ? 0.15 : 0);
  const f3 = 0.85 + (c3 / n) * 0.5 + (hasTransit || hasStreet ? 0.2 : 0);

  return {
    segments: [
      {
        flex: f1,
        className:
          "rounded-full bg-gradient-to-r from-blue-700 to-cyan-600 shadow-md shadow-cyan-600/25",
      },
      {
        flex: f2,
        className: "rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500/80",
      },
      {
        flex: f3,
        className: "rounded-full bg-gradient-to-r from-cyan-500/50 to-cyan-400/35",
      },
    ],
    lines: [line1, line2, line3],
  };
}
