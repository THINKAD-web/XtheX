import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { MediaStatus } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  if (ids.length === 0 || !isDatabaseConfigured()) {
    return NextResponse.json({ medias: [] });
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const validIds = ids.filter((id) => uuidPattern.test(id));
  if (validIds.length === 0) {
    return NextResponse.json({ medias: [] });
  }

  try {
    const rows = await prisma.media.findMany({
      where: { id: { in: validIds }, status: MediaStatus.PUBLISHED },
      select: {
        id: true,
        mediaName: true,
        category: true,
        locationJson: true,
        images: true,
        sampleImages: true,
        price: true,
      },
    });

    const medias = rows.map((m) => {
      const loc = (m.locationJson ?? {}) as Record<string, unknown>;
      const allImages = [
        ...(m.sampleImages ?? []).filter((u: string) =>
          /^https?:\/\//i.test(u),
        ),
        ...(m.images ?? []),
      ];
      return {
        id: m.id,
        mediaName: m.mediaName,
        category: m.category,
        location:
          typeof loc.district === "string"
            ? loc.district
            : typeof loc.address === "string"
              ? loc.address
              : null,
        image: allImages[0] ?? null,
        price: m.price,
      };
    });

    return NextResponse.json({ medias });
  } catch {
    return NextResponse.json({ medias: [] });
  }
}
