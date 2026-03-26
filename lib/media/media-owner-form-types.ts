import { MediaCategory } from "@prisma/client";

export const MEDIA_OWNER_FORM_TYPES = [
  { value: "DOOH", labelKo: "DOOH", category: MediaCategory.DIGITAL_BOARD },
  { value: "BUS", labelKo: "버스", category: MediaCategory.TRANSIT },
  { value: "SUBWAY", labelKo: "지하철", category: MediaCategory.TRANSIT },
  { value: "BUILDING", labelKo: "빌딩", category: MediaCategory.BILLBOARD },
  { value: "KIOSK", labelKo: "키오스크", category: MediaCategory.STREET_FURNITURE },
  { value: "OTHER", labelKo: "기타", category: MediaCategory.ETC },
] as const;

export type MediaOwnerFormTypeValue =
  (typeof MEDIA_OWNER_FORM_TYPES)[number]["value"];

export function formTypeToCategory(
  raw: string | null | undefined,
): { category: MediaCategory; labelKo: string } {
  const row = MEDIA_OWNER_FORM_TYPES.find((x) => x.value === raw);
  if (row) return { category: row.category, labelKo: row.labelKo };
  return { category: MediaCategory.ETC, labelKo: "기타" };
}
