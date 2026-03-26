import type { MediaCategory, MediaStatus, Prisma } from "@prisma/client";
import { getOwnerSubmittedForReviewAt } from "@/lib/media/owner-review-submission";

export type AdminMediaListRowSerialized = {
  id: string;
  mediaName: string;
  category: MediaCategory;
  subCategory: string | null;
  locationShort: string;
  ownerLabel: string;
  priceKrw: number | null;
  status: MediaStatus;
  /** 서버 시각 기준 상대 표기 (오늘/어제/N일 전/YYYY-MM-DD) */
  submittedDisplayShort: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 한국 시간 기준. 오늘·어제는 시각 포함, 2~7일 전은 "N일 전", 그 외 YYYY-MM-DD */
export function formatSubmittedRelativeKorean(iso: string, now: Date = new Date()): string {
  const event = new Date(iso);
  if (Number.isNaN(event.getTime())) return "—";

  const seoulYmd = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);

  const eventDay = seoulYmd(event);
  const todayDay = seoulYmd(now);

  const parseYmdUtc = (ymd: string) => {
    const [y, m, da] = ymd.split("-").map((x) => Number(x));
    if (!y || !m || !da) return new Date(0);
    return new Date(Date.UTC(y, m - 1, da));
  };
  const dEvent = parseYmdUtc(eventDay);
  const dToday = parseYmdUtc(todayDay);
  const diffDays = Math.round((dToday.getTime() - dEvent.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return eventDay;

  const hm = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(event);

  if (diffDays === 0) return `오늘 ${hm}`;
  if (diffDays === 1) return `어제 ${hm}`;
  if (diffDays >= 2 && diffDays <= 7) return `${diffDays}일 전`;
  return eventDay;
}

function subCategoryFromParseHistory(
  parseHistory: Prisma.JsonValue | null | undefined,
): string | null {
  if (!parseHistory || typeof parseHistory !== "object" || Array.isArray(parseHistory)) {
    return null;
  }
  const root = parseHistory as Record<string, unknown>;
  const v2 =
    root.reviewFormV2 && typeof root.reviewFormV2 === "object"
      ? (root.reviewFormV2 as Record<string, unknown>)
      : {};
  const s = v2.sub_category;
  return typeof s === "string" && s.trim() ? s.trim() : null;
}

/** 구·동 등 짧은 위치 표기 */
export function locationShortFromJson(locationJson: Prisma.JsonValue): string {
  if (!locationJson || typeof locationJson !== "object" || Array.isArray(locationJson)) {
    return "—";
  }
  const o = locationJson as Record<string, unknown>;
  const district = typeof o.district === "string" ? o.district.trim() : "";
  const address = typeof o.address === "string" ? o.address.trim() : "";
  const guFromAddr = address.match(/[가-힣a-zA-Z0-9]+구(?=\s|,|$)/)?.[0];
  const dong = address.match(/[가-힣a-zA-Z0-9]+동(?=\s|,|$)/)?.[0];
  const gu = district || guFromAddr || "";
  const parts = [gu, dong].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  if (address.length > 0) return address.length > 28 ? `${address.slice(0, 28)}…` : address;
  return "—";
}

export function serializeAdminMediaListRow(m: {
  id: string;
  mediaName: string;
  category: MediaCategory;
  status: MediaStatus;
  locationJson: Prisma.JsonValue;
  price: number | null;
  parseHistory: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { email: string | null; name: string | null } | null;
}): AdminMediaListRowSerialized {
  const owner =
    m.createdBy?.name?.trim() || m.createdBy?.email?.trim() || "—";
  const rawSubmitted = getOwnerSubmittedForReviewAt(m.parseHistory);
  const submittedDisplayShort = rawSubmitted
    ? formatSubmittedRelativeKorean(rawSubmitted, new Date())
    : null;

  return {
    id: m.id,
    mediaName: m.mediaName,
    category: m.category,
    subCategory: subCategoryFromParseHistory(m.parseHistory),
    locationShort: locationShortFromJson(m.locationJson),
    ownerLabel: owner,
    priceKrw: m.price,
    status: m.status,
    submittedDisplayShort,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}
