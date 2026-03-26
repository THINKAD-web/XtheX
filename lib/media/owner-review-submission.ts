import type { Prisma } from "@prisma/client";

/** parseHistory.ownerSubmittedForReviewAt — 매체사 최종 등록 신청 시각 */
export function getOwnerSubmittedForReviewAt(
  parseHistory: Prisma.JsonValue | null | undefined,
): string | null {
  if (!parseHistory || typeof parseHistory !== "object" || Array.isArray(parseHistory)) {
    return null;
  }
  const v = (parseHistory as Record<string, unknown>).ownerSubmittedForReviewAt;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function hasOwnerSubmittedForReview(
  parseHistory: Prisma.JsonValue | null | undefined,
): boolean {
  return getOwnerSubmittedForReviewAt(parseHistory) != null;
}

/** 관리자 화면용: 한국 시간 기준 `YYYY-MM-DD HH:mm` */
export function formatOwnerSubmittedForAdmin(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = f.formatToParts(d);
  const v = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "";
  const y = v("year");
  const mo = v("month").padStart(2, "0");
  const day = v("day").padStart(2, "0");
  let h = v("hour");
  let min = v("minute");
  if (/^\d$/.test(h)) h = h.padStart(2, "0");
  if (/^\d$/.test(min)) min = min.padStart(2, "0");
  if (!y || !mo || !day) return null;
  return `${y}-${mo}-${day} ${h}:${min}`;
}
