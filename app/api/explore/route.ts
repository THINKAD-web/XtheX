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
  size: z.string().optional(),
  sort: z.string().optional(),
  take: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().optional(), // id
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(searchParams);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { mediaType, q, priceMin, priceMax, size, sort, take = 20, cursor } = parsed.data;

  const where: Prisma.MediaWhereInput = { status: MediaStatus.PUBLISHED };

  if (mediaType && mediaType !== "ALL") {
    if (Object.values(MediaCategory).includes(mediaType as any)) {
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
    where.OR = or;
  }

  // Bounds filter: bounds=swLat,swLng,neLat,neLng
  const boundsStr = (searchParams as any).bounds as string | undefined;
  if (boundsStr) {
    const parts = boundsStr.split(",").map((v) => Number.parseFloat(v));
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      const [swLat, swLng, neLat, neLng] = parts as [number, number, number, number];
      if (swLat < neLat && swLng < neLng) {
        // eslint-disable-next-line no-console
        console.log("Applying bounds filter (Media):", { swLat, swLng, neLat, neLng });

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
      images: true,
      sampleImages: true,
      createdAt: true,
    },
  });

  const httpOnly = (urls: string[]) =>
    urls.filter((u) => /^https?:\/\//i.test(String(u).trim()));

  let items = medias.map((m) => ({
    id: m.id,
    title: m.mediaName,
    description: m.description ?? "",
    location: m.locationJson,
    mediaType: m.category,
    size: "",
    priceMin: m.price ?? null,
    priceMax: m.price ?? null,
    images: [...httpOnly(m.sampleImages ?? []), ...(m.images ?? [])].slice(0, 8),
    createdAt: m.createdAt.toISOString(),
  }));

  // When there is no real media yet, return a mock marker so that
  // the map/list/popup UX can be experienced.
  if (items.length === 0 && !idCursor) {
    items = [
      {
        id: "mock-media-1",
        title: "MOCK 강남대로 디지털 보드",
        description: "강남역 사거리 인근 테스트용 디지털 보드 매체입니다.",
        location: {
          address: "서울 강남구 강남대로 390",
          district: "강남구",
          lat: 37.4979,
          lng: 127.0276,
        },
        mediaType: MediaCategory.DIGITAL_BOARD,
        size: "",
        priceMin: 3000000,
        priceMax: 5000000,
        images: ["https://picsum.photos/800/600?random=11"],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  const nextCursor =
    medias.length === take
      ? medias[medias.length - 1]!.id
      : null;

  return NextResponse.json({ items, nextCursor });
}

