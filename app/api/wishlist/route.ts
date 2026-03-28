import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      media: {
        select: {
          id: true,
          mediaName: true,
          category: true,
          description: true,
          price: true,
          sampleImages: true,
          images: true,
          locationJson: true,
          status: true,
        },
      },
    },
  });

  return NextResponse.json({
    items: items
      .filter((w) => w.media.status === "PUBLISHED")
      .map((w) => ({
        id: w.id,
        mediaId: w.mediaId,
        createdAt: w.createdAt,
        media: w.media,
      })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const mediaId = body?.mediaId as string | undefined;
  if (!mediaId) {
    return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
  }

  const existing = await prisma.wishlist.findUnique({
    where: { userId_mediaId: { userId, mediaId } },
  });

  if (existing) {
    return NextResponse.json({ wishlisted: true, id: existing.id });
  }

  const item = await prisma.wishlist.create({
    data: { userId, mediaId },
  });

  return NextResponse.json({ wishlisted: true, id: item.id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get("mediaId");
  if (!mediaId) {
    return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
  }

  await prisma.wishlist.deleteMany({
    where: { userId, mediaId },
  });

  return NextResponse.json({ wishlisted: false });
}
