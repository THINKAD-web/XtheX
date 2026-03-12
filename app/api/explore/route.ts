import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MediaType, Prisma, ProposalStatus } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  mediaType: z.string().optional(),
  q: z.string().optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().nonnegative().optional(),
  size: z.string().optional(),
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

  const { mediaType, q, priceMin, priceMax, size, take = 20, cursor } = parsed.data;

  const where: Prisma.MediaProposalWhereInput = { status: ProposalStatus.APPROVED };

  if (mediaType && mediaType !== "ALL") {
    if (Object.values(MediaType).includes(mediaType as any)) {
      where.mediaType = mediaType as MediaType;
    }
  }
  if (typeof priceMin === "number") where.priceMax = { gte: priceMin };
  if (typeof priceMax === "number") where.priceMin = { lte: priceMax };
  if (size && size.trim()) where.size = { contains: size.trim(), mode: "insensitive" };
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  // Bounds filter: bounds=swLat,swLng,neLat,neLng
  const boundsStr = (searchParams as any).bounds as string | undefined;
  if (boundsStr) {
    const parts = boundsStr.split(",").map((v) => Number.parseFloat(v));
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      const [swLat, swLng, neLat, neLng] = parts as [number, number, number, number];
      if (swLat < neLat && swLng < neLng) {
        // Optional: log for debugging
        // eslint-disable-next-line no-console
        console.log("Applying bounds filter:", { swLat, swLng, neLat, neLng });

        const and: Prisma.MediaProposalWhereInput[] = Array.isArray(where.AND)
          ? [...where.AND]
          : where.AND
          ? [where.AND]
          : [];

        and.push(
          {
            location: {
              path: ["lat"],
              gte: swLat,
              lte: neLat,
            },
          },
          {
            location: {
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

  const items = await prisma.mediaProposal.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(idCursor
      ? {
          skip: 1,
          cursor: { id: idCursor },
        }
      : {}),
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      mediaType: true,
      size: true,
      priceMin: true,
      priceMax: true,
      images: true,
      createdAt: true,
    },
  });

  const nextCursor =
    items.length === take
      ? items[items.length - 1]!.id
      : null;

  return NextResponse.json({ items, nextCursor });
}

