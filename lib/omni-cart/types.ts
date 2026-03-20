export type OmniMediaCategory =
  | "BILLBOARD"
  | "DIGITAL_BOARD"
  | "TRANSIT"
  | "STREET_FURNITURE"
  | "WALL"
  | "ETC"
  | "UNKNOWN";

/**
 * 옴니채널 카트 항목 (localStorage `xthex-omni-cart-v1`).
 * 순서는 배열 순서이며, @dnd-kit 으로 같은 카테고리 내에서만 재정렬 가능.
 */
export type OmniCartItem = {
  id: string;
  mediaName: string;
  category?: string;
  /** Prisma MediaCategory 계열 — 그룹·아이콘용 */
  mediaCategory?: OmniMediaCategory;
  priceMin: number | null;
  priceMax: number | null;
  source?: "explore" | "mix";
};

export const OMNI_CART_STORAGE_KEY = "xthex-omni-cart-v1";
export const OMNI_CART_EVENT = "xthex-omni-cart-change";
/** add/addMany 성공 시 배지 애니메이션용 (Shell 등에서 구독) */
export const OMNI_CART_ADD_FEEDBACK = "xthex-omni-cart-add-feedback";
