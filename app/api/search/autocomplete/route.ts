import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { MediaStatus } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const medias = await prisma.media.findMany({
      where: {
        status: MediaStatus.PUBLISHED,
        OR: [
          { mediaName: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { hasSome: [q] } },
          {
            locationJson: {
              path: ["address"],
              string_contains: q,
              mode: "insensitive",
            },
          },
          {
            locationJson: {
              path: ["district"],
              string_contains: q,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: [{ trustScore: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        mediaName: true,
        category: true,
        locationJson: true,
        tags: true,
      },
    });

    const results = medias.map((m) => {
      const loc = (m.locationJson ?? {}) as Record<string, unknown>;
      return {
        id: m.id,
        title: m.mediaName,
        category: m.category,
        address:
          typeof loc.district === "string"
            ? loc.district
            : typeof loc.address === "string"
              ? loc.address
              : null,
        tags: (m.tags ?? []).slice(0, 3),
      };
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
