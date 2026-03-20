import type { MediaCategory } from "@prisma/client";
import type { OmniCartItem, OmniMediaCategory } from "./types";

const ORDER: OmniMediaCategory[] = [
  "BILLBOARD",
  "DIGITAL_BOARD",
  "TRANSIT",
  "STREET_FURNITURE",
  "WALL",
  "ETC",
  "UNKNOWN",
];

export const OMNI_CATEGORY_LABEL_KO: Record<OmniMediaCategory, string> = {
  BILLBOARD: "빌보드",
  DIGITAL_BOARD: "디지털",
  TRANSIT: "대중교통·지하철",
  STREET_FURNITURE: "가로시설",
  WALL: "벽면",
  ETC: "기타",
  UNKNOWN: "미분류",
};

/** 옴니 카트 모달 그룹 헤더용 라벨 */
export const OMNI_MODAL_GROUP_LABEL_KO: Record<OmniMediaCategory, string> = {
  BILLBOARD: "빌보드",
  DIGITAL_BOARD: "디지털사이니지",
  TRANSIT: "지하철·택시",
  STREET_FURNITURE: "가로·버스쉘터",
  WALL: "벽면·대형 포맷",
  ETC: "기타 매체",
  UNKNOWN: "미분류",
};

export function getOmniMediaCategory(item: OmniCartItem): OmniMediaCategory {
  const raw = item.mediaCategory;
  if (raw && ORDER.includes(raw as OmniMediaCategory)) {
    return raw as OmniMediaCategory;
  }
  const c = (item.category ?? "").toUpperCase();
  if (
    c.includes("DIGITAL") ||
    c === "DIGITAL" ||
    c.includes("디지털")
  )
    return "DIGITAL_BOARD";
  if (
    c === "TRANSIT" ||
    c.includes("TRANSIT") ||
    c.includes("지하") ||
    c.includes("대중")
  )
    return "TRANSIT";
  if (c.includes("STREET") || c.includes("가로")) return "STREET_FURNITURE";
  if (c.includes("WALL") || c.includes("벽")) return "WALL";
  if (c === "BILLBOARD" || c.includes("빌보드")) return "BILLBOARD";
  if (c === "OTHER" || c === "ETC" || c.includes("기타")) return "ETC";
  return "UNKNOWN";
}

export function exploreMediaTypeToCategory(
  mediaType: string,
): OmniMediaCategory {
  const u = mediaType.toUpperCase();
  if (u === "BILLBOARD") return "BILLBOARD";
  if (u === "DIGITAL") return "DIGITAL_BOARD";
  if (u === "TRANSIT") return "TRANSIT";
  if (u === "OTHER") return "ETC";
  return "UNKNOWN";
}

export function mixCategoryToOmni(c: MediaCategory): OmniMediaCategory {
  const map: Record<MediaCategory, OmniMediaCategory> = {
    BILLBOARD: "BILLBOARD",
    DIGITAL_BOARD: "DIGITAL_BOARD",
    TRANSIT: "TRANSIT",
    STREET_FURNITURE: "STREET_FURNITURE",
    WALL: "WALL",
    ETC: "ETC",
  };
  return map[c] ?? "UNKNOWN";
}

export function orderedOmniCategories(): OmniMediaCategory[] {
  return [...ORDER];
}

export function groupItemsByOmniCategory(
  items: OmniCartItem[],
): Map<OmniMediaCategory, OmniCartItem[]> {
  const m = new Map<OmniMediaCategory, OmniCartItem[]>();
  for (const cat of ORDER) m.set(cat, []);
  for (const it of items) {
    const c = getOmniMediaCategory(it);
    m.get(c)!.push(it);
  }
  return m;
}
