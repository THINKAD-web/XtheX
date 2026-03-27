import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MediaCategory, MediaStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { audienceTagsMatchingSearchQuery } from "@/lib/media/audience-tags";

const querySchema = z.object({
  mediaType: z.string().optional(),
  q: z.string().optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().nonnegative().optional(),
  /** 지역·구/주소 키워드 */
  district: z.string().optional(),
  /** 노출·신뢰도 하한 (0–100, trustScore) */
  minTrustScore: z.coerce.number().int().min(0).max(100).optional(),
  size: z.string().optional(),
  sort: z.string().optional(),
  /** List: up to 50. Map bundle: up to 500 when map=1 */
  take: z.coerce.number().int().min(1).max(500).optional(),
  cursor: z.string().optional(), // id
  /** When set, return more rows and only medias with lat/lng in locationJson (map pins) */
  map: z.enum(["1", "true"]).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const {
    mediaType,
    q,
    priceMin,
    priceMax,
    district,
    minTrustScore,
    size,
    sort,
    take: takeRaw,
    cursor,
    map: mapParam,
  } = parsed.data;

  const mapMode = mapParam === "1" || mapParam === "true";
  const take = mapMode
    ? Math.min(takeRaw ?? 500, 500)
    : Math.min(takeRaw ?? 20, 50);

  const where: Prisma.MediaWhereInput = { status: MediaStatus.PUBLISHED };

  if (mediaType && mediaType !== "ALL") {
    if (Object.values(MediaCategory).includes(mediaType as MediaCategory)) {
      where.category = mediaType as MediaCategory;
    }
  }
  if (typeof priceMin === "number" && typeof priceMax === "number") {
    where.price = { gte: priceMin, lte: priceMax };
  } else if (typeof priceMin === "number") {
    where.price = { gte: priceMin };
  } else if (typeof priceMax === "number") {
    where.price = { lte: priceMax };
  }
  if (typeof minTrustScore === "number") {
    where.trustScore = { gte: minTrustScore };
  }
  if (district?.trim()) {
    const term = district.trim();
    const districtFilter: Prisma.MediaWhereInput = {
      OR: [
        {
          locationJson: {
            path: ["district"],
            string_contains: term,
            mode: "insensitive",
          },
        },
        {
          locationJson: {
            path: ["address"],
            string_contains: term,
            mode: "insensitive",
          },
        },
      ],
    };
    const prevAnd = where.AND;
    const andArr: Prisma.MediaWhereInput[] = Array.isArray(prevAnd)
      ? [...prevAnd]
      : prevAnd
        ? [prevAnd]
        : [];
    andArr.push(districtFilter);
    where.AND = andArr;
  }
  if (q && q.trim()) {
    const term = q.trim();
    const audHits = audienceTagsMatchingSearchQuery(term);
    const or: Prisma.MediaWhereInput[] = [
      { mediaName: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { targetAudience: { contains: term, mode: "insensitive" } },
    ];
    if (audHits.length > 0) {
      or.push({ audienceTags: { hasSome: audHits } });
    }
    const qBlock: Prisma.MediaWhereInput = { OR: or };
    const prevAnd = where.AND;
    const andArr: Prisma.MediaWhereInput[] = Array.isArray(prevAnd)
      ? [...prevAnd]
      : prevAnd
        ? [prevAnd]
        : [];
    andArr.push(qBlock);
    where.AND = andArr;
  }

  /** Map view: only rows with coordinates (Leaflet markers) */
  if (mapMode) {
    const geoBlock: Prisma.MediaWhereInput = {
      AND: [
        { locationJson: { path: ["lat"], gte: -90, lte: 90 } },
        { locationJson: { path: ["lng"], gte: -180, lte: 180 } },
      ],
    };
    const prevAnd = where.AND;
    const andArr: Prisma.MediaWhereInput[] = Array.isArray(prevAnd)
      ? [...prevAnd]
      : prevAnd
        ? [prevAnd]
        : [];
    andArr.push(geoBlock);
    where.AND = andArr;
  }

  // Bounds filter: bounds=swLat,swLng,neLat,neLng
  const boundsStr = (searchParams as any).bounds as string | undefined;
  if (boundsStr) {
    const parts = boundsStr.split(",").map((v) => Number.parseFloat(v));
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      const [swLat, swLng, neLat, neLng] = parts as [number, number, number, number];
      if (swLat < neLat && swLng < neLng) {
        const and: Prisma.MediaWhereInput[] = Array.isArray(where.AND)
          ? [...where.AND]
          : where.AND
          ? [where.AND]
          : [];

        and.push(
          {
            locationJson: {
              path: ["lat"],
              gte: swLat,
              lte: neLat,
            },
          },
          {
            locationJson: {
              path: ["lng"],
              gte: swLng,
              lte: neLng,
            },
          },
        );

        where.AND = and;
      }
    }
  }

  const idCursor = cursor && cursor.trim() ? cursor.trim() : undefined;

  const orderBy: Prisma.MediaOrderByWithRelationInput[] =
    sort === "priceAsc"
      ? [{ price: "asc" }, { createdAt: "desc" }]
      : sort === "priceDesc"
        ? [{ price: "desc" }, { createdAt: "desc" }]
        : sort === "trustDesc"
          ? [{ trustScore: "desc" }, { createdAt: "desc" }]
          : sort === "aiDesc"
            ? [{ aiReviewScore: "desc" }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }, { id: "desc" }];

  const medias = await prisma.media.findMany({
    where,
    orderBy,
    take,
    ...(idCursor
      ? {
          skip: 1,
          cursor: { id: idCursor },
        }
      : {}),
    select: {
      id: true,
      mediaName: true,
      description: true,
      locationJson: true,
      category: true,
      price: true,
      cpm: true,
      exposureJson: true,
      trustScore: true,
      aiReviewScore: true,
      images: true,
      sampleImages: true,
      createdAt: true,
    },
  });

  const httpOnly = (urls: string[]) =>
    urls.filter((u) => /^https?:\/\//i.test(String(u).trim()));

  function formatDailyExposure(exposureJson: unknown): string | null {
    if (!exposureJson || typeof exposureJson !== "object") return null;
    const o = exposureJson as Record<string, unknown>;
    const v = o.daily_traffic ?? o.daily_impressions;
    return v != null ? String(v) : null;
  }

  let items = medias.map((m) => ({
    id: m.id,
    title: m.mediaName,
    description: m.description ?? "",
    location: m.locationJson,
    mediaType: m.category,
    size: "",
    priceMin: m.price ?? null,
    priceMax: m.price ?? null,
    trustScore: m.trustScore ?? null,
    aiReviewScore: m.aiReviewScore ?? null,
    dailyExposure: formatDailyExposure(m.exposureJson),
    images: [...httpOnly(m.sampleImages ?? []), ...(m.images ?? [])].slice(0, 8),
    createdAt: m.createdAt.toISOString(),
  }));

  const nextCursor =
    medias.length === take
      ? medias[medias.length - 1]!.id
      : null;

  return NextResponse.json({ items, nextCursor });
}

