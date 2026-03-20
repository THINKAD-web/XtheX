import type { OmniCartItem, OmniMediaCategory } from "./types";
import { getOmniMediaCategory } from "./category";

/**
 * 카트에 담긴 MediaCategory 조합으로 추천 캠페인 흐름 문구 생성 (룰 기반).
 */
export function buildOmniCampaignFlow(items: OmniCartItem[]): {
  week1: string;
  week2: string;
} {
  const cats = new Set<OmniMediaCategory>();
  for (const it of items) cats.add(getOmniMediaCategory(it));

  const w1: string[] = [];
  if (cats.has("BILLBOARD") || cats.has("WALL")) w1.push("대형 빌보드");
  if (cats.has("DIGITAL_BOARD")) w1.push("디지털사이니지");
  if (w1.length === 0) {
    if (cats.has("STREET_FURNITURE")) w1.push("가로·근접 노출");
    else if (cats.has("TRANSIT")) w1.push("이동 매체 우선 노출");
    else w1.push("브랜드 인지 확대");
  }

  const w2: string[] = [];
  if (cats.has("TRANSIT")) w2.push("지하철·택시");
  if (cats.has("DIGITAL_BOARD")) w2.push("디지털");
  if (cats.has("STREET_FURNITURE")) w2.push("가로시설");
  if (cats.has("BILLBOARD") && !w2.length) w2.push("보조 빌보드");
  if (cats.has("ETC") || cats.has("UNKNOWN")) w2.push("기타 터치포인트");
  if (w2.length === 0) {
    if (cats.has("BILLBOARD") || cats.has("WALL")) w2.push("전환 보강 매체");
    else w2.push("유입·전환 집중");
  }

  const uniq = (a: string[]) => [...new Set(a)];

  return {
    week1: `1주차: 인지도 폭발 → ${uniq(w1).slice(0, 3).join(" · ")}`,
    week2: `2~4주차: 행동 유도 → ${uniq(w2).slice(0, 4).join(" · ")}`,
  };
}
