import { prisma } from "@/lib/prisma";

export type SimilarMediaCard = {
  id: string;
  mediaName: string;
  category: string;
  locationJson: any;
  price: number | null;
  cpm: number | null;
  trustScore: number | null;
  pros: string | null;
};

// Low-effort overrides by keyword in mediaName (demo-friendly)
const SIMILAR_OVERRIDES: Array<{ keyword: string; keywordsAny?: string[] }> = [
  { keyword: "강남", keywordsAny: ["여의도", "코엑스", "잠실"] },
  { keyword: "홍대", keywordsAny: ["강남", "서울역"] },
  { keyword: "여의도", keywordsAny: ["강남", "코엑스"] },
];

function pickOverrideKeywords(mediaName: string): string[] {
  const name = mediaName.toLowerCase();
  for (const o of SIMILAR_OVERRIDES) {
    if (name.includes(o.keyword.toLowerCase())) return o.keywordsAny ?? [];
  }
  return [];
}

export async function getSimilarMediasForMedia(media: {
  id: string;
  mediaName: string;
  category: string;
  locationJson: any;
  cpm: number | null;
}): Promise<SimilarMediaCard[]> {
  const loc = (media.locationJson ?? {}) as any;
  const district = (loc?.district as string | undefined) ?? undefined;
  const baseCpm = typeof media.cpm === "number" ? media.cpm : null;

  const overrideKeywords = pickOverrideKeywords(media.mediaName);

  // 1) override keywords (name/address contains) + same category
  if (overrideKeywords.length > 0) {
    const rows = await prisma.media.findMany({
      where: {
        id: { not: media.id },
        status: "PUBLISHED",
        category: media.category as any,
        OR: overrideKeywords.map((k) => ({
          OR: [
            { mediaName: { contains: k, mode: "insensitive" } },
            {
              locationJson: {
                path: ["address"],
                string_contains: k,
              } as any,
            },
          ],
        })) as any,
      } as any,
      orderBy: [{ updatedAt: "desc" }],
      take: 3,
      select: {
        id: true,
        mediaName: true,
        category: true,
        locationJson: true,
        price: true,
        cpm: true,
        trustScore: true,
        pros: true,
      },
    });
    if (rows.length >= 2) return rows as any;
  }

  // 2) district + same category + near cpm (±30%) then fallback to just district
  const whereBase: any = {
    id: { not: media.id },
    status: "PUBLISHED",
    category: media.category as any,
  };
  const districtFilter =
    district != null
      ? {
          locationJson: {
            path: ["district"],
            equals: district,
          },
        }
      : null;

  const rows = await prisma.media.findMany({
    where: {
      ...whereBase,
      ...(districtFilter ?? {}),
      ...(baseCpm != null
        ? { cpm: { gte: Math.round(baseCpm * 0.7), lte: Math.round(baseCpm * 1.3) } }
        : {}),
    },
    orderBy: [{ trustScore: "desc" }, { updatedAt: "desc" }],
    take: 3,
    select: {
      id: true,
      mediaName: true,
      category: true,
      locationJson: true,
      price: true,
      cpm: true,
      trustScore: true,
      pros: true,
    },
  });
  if (rows.length > 0) return rows as any;

  if (districtFilter) {
    const rows2 = await prisma.media.findMany({
      where: { ...whereBase, ...districtFilter },
      orderBy: [{ updatedAt: "desc" }],
      take: 3,
      select: {
        id: true,
        mediaName: true,
        category: true,
        locationJson: true,
        price: true,
        cpm: true,
        trustScore: true,
        pros: true,
      },
    });
    return rows2 as any;
  }

  return [];
}

export async function getBundleRecommendationsForCompare(input: {
  mediaIds: string[];
}): Promise<SimilarMediaCard[]> {
  // Low-effort: take one representative media (first) and reuse similar logic
  const base = await prisma.media.findFirst({
    where: { id: { in: input.mediaIds }, status: "PUBLISHED" },
    select: { id: true, mediaName: true, category: true, locationJson: true, cpm: true },
  });
  if (!base) return [];
  return await getSimilarMediasForMedia(base as any);
}

