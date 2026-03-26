/**
 * 관리자 미디어 목록 쿼리
 *
 * - 정렬: 전체 조건에 맞는 행을 DB에서 모두 읽은 뒤 메모리에서 정렬합니다.
 *   (PENDING 우선 → 동일 시 최종 신청 시각 최신순 → 수정일 최신순)
 * - 매체 수가 매우 많아지면 DB 단 정렬/인덱스(예: ownerSubmittedAt 컬럼) 도입을 검토하세요.
 */
import type { MediaStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOwnerSubmittedForReviewAt } from "@/lib/media/owner-review-submission";

export type AdminMediasReviewFilter = "all" | "pending" | "published" | "rejected";

export function buildAdminMediasWhere(
  review: AdminMediasReviewFilter,
  qRaw: string | undefined,
): Prisma.MediaWhereInput {
  const q = qRaw?.trim();
  const parts: Prisma.MediaWhereInput[] = [];

  if (review === "pending") parts.push({ status: "PENDING" });
  else if (review === "published") parts.push({ status: "PUBLISHED" });
  else if (review === "rejected") parts.push({ status: "REJECTED" });

  if (q) {
    const locationOr: Prisma.MediaWhereInput[] = [
      {
        locationJson: {
          path: ["address"],
          string_contains: q,
        },
      },
      {
        locationJson: {
          path: ["district"],
          string_contains: q,
        },
      },
    ];
    parts.push({
      OR: [
        { mediaName: { contains: q, mode: "insensitive" } },
        {
          createdBy: {
            is: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
        ...locationOr,
      ],
    });
  }

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

type LightRow = {
  id: string;
  status: MediaStatus;
  parseHistory: Prisma.JsonValue | null;
  updatedAt: Date;
};

function submittedSortKey(parseHistory: Prisma.JsonValue | null): number {
  const s = getOwnerSubmittedForReviewAt(parseHistory);
  if (!s) return 0;
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** 승인 대기(PENDING) 상단 → 최종 신청 최신순 → 그 외는 수정일 최신순 */
export function sortAdminMediaLightRows(rows: LightRow[]): LightRow[] {
  return [...rows].sort((a, b) => {
    const ap = a.status === "PENDING" ? 0 : 1;
    const bp = b.status === "PENDING" ? 0 : 1;
    if (ap !== bp) return ap - bp;
    if (a.status === "PENDING" && b.status === "PENDING") {
      const diff = submittedSortKey(b.parseHistory) - submittedSortKey(a.parseHistory);
      if (diff !== 0) return diff;
    }
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

const listSelect = {
  id: true,
  mediaName: true,
  category: true,
  status: true,
  locationJson: true,
  price: true,
  parseHistory: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { email: true, name: true } },
} satisfies Prisma.MediaSelect;

export type AdminMediaListDbRow = Prisma.MediaGetPayload<{ select: typeof listSelect }>;

export async function fetchAdminMediasListPage(args: {
  where: Prisma.MediaWhereInput;
  page: number;
  pageSize: number;
}): Promise<{ total: number; rows: AdminMediaListDbRow[] }> {
  const { where, page, pageSize } = args;
  const total = await prisma.media.count({ where });

  const light = await prisma.media.findMany({
    where,
    select: {
      id: true,
      status: true,
      parseHistory: true,
      updatedAt: true,
    },
  });

  const sorted = sortAdminMediaLightRows(light);
  const start = Math.max(0, (page - 1) * pageSize);
  const pageIds = sorted.slice(start, start + pageSize).map((r) => r.id);
  if (pageIds.length === 0) {
    return { total, rows: [] };
  }

  const unsorted = await prisma.media.findMany({
    where: { id: { in: pageIds } },
    select: listSelect,
  });
  const order = new Map(pageIds.map((id, i) => [id, i]));
  unsorted.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return { total, rows: unsorted };
}
