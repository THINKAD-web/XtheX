import { unstable_cache } from "next/cache";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export type TrendingMedia = {
  id: string;
  mediaName: string;
  category: string;
  locationJson: any;
  cpm: number | null;
  trustScore: number | null;
  viewCount?: number | null;
  updatedAt: Date;
  createdAt: Date;
};

const SEOUL_KEYWORDS = [
  "강남",
  "홍대",
  "여의도",
  "코엑스",
  "서울역",
  "잠실",
  "gangnam",
  "hongdae",
  "yeouido",
  "coex",
  "seoul",
];

function seoulScore(m: { mediaName: string; locationJson: any }): number {
  const loc = (m.locationJson ?? {}) as any;
  const text = `${m.mediaName} ${loc.address ?? ""} ${loc.district ?? ""}`.toLowerCase();
  return SEOUL_KEYWORDS.reduce((acc, k) => acc + (text.includes(k) ? 1 : 0), 0);
}

async function fetchTrendingMediasTop5(preferSeoul: boolean): Promise<TrendingMedia[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }
  try {
    try {
      const rows = await prisma.media.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ viewCount: "desc" as any }, { updatedAt: "desc" }],
        take: 5,
        select: {
          id: true,
          mediaName: true,
          category: true,
          locationJson: true,
          cpm: true,
          trustScore: true,
          viewCount: true as any,
          updatedAt: true,
          createdAt: true,
        },
      });

      const sorted = preferSeoul
        ? [...(rows as any[])].sort((a, b) => seoulScore(b) - seoulScore(a))
        : (rows as any[]);
      return sorted as TrendingMedia[];
    } catch {
      const rows = await prisma.media.findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          mediaName: true,
          category: true,
          locationJson: true,
          cpm: true,
          trustScore: true,
          updatedAt: true,
          createdAt: true,
        },
      });

      const sorted = preferSeoul
        ? [...rows].sort((a, b) => seoulScore(b) - seoulScore(a))
        : rows;

      return sorted as TrendingMedia[];
    }
  } catch {
    return [];
  }
}

const trendingCachedSeoul = unstable_cache(
  async () => fetchTrendingMediasTop5(true),
  ["xthex-trending-top5-seoul"],
  { revalidate: 120 },
);

/**
 * Low-effort 트렌딩 (홈 등). 서울 우선 모드는 2분 캐시로 DB 부하 감소.
 */
export async function getTrendingMediasTop5(opts?: { preferSeoul?: boolean }) {
  const preferSeoul = opts?.preferSeoul ?? true;
  if (preferSeoul) return trendingCachedSeoul();
  return fetchTrendingMediasTop5(false);
}

