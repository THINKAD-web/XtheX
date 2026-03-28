import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";

const createReviewSchema = z.object({
  mediaId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().max(2000).optional(),
  images: z.array(z.string().url()).max(5).optional(),
});

export async function GET(req: NextRequest) {
  const mediaId = req.nextUrl.searchParams.get("mediaId");
  if (!mediaId) {
    return NextResponse.json(
      { error: "mediaId query parameter is required" },
      { status: 400 },
    );
  }

  const sort = req.nextUrl.searchParams.get("sort");
  const orderBy =
    sort === "rating"
      ? [{ rating: "desc" as const }, { createdAt: "desc" as const }]
      : { createdAt: "desc" as const };

  const whereVisible = { mediaId, visible: true };

  const [reviews, agg] = await Promise.all([
    prisma.mediaReview.findMany({
      where: whereVisible,
      orderBy,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.mediaReview.aggregate({
      where: whereVisible,
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const totalCount = agg._count._all;
  const averageRating =
    agg._avg.rating != null ? Number(agg._avg.rating) : 0;

  return NextResponse.json({ reviews, averageRating, totalCount });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { mediaId, rating, content, images } = parsed.data;

  const existing = await prisma.mediaReview.findUnique({
    where: { mediaId_userId: { mediaId, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this media" },
      { status: 409 },
    );
  }

  const review = await prisma.mediaReview.create({
    data: {
      mediaId,
      userId: user.id,
      rating,
      content: content ?? null,
      images: images ?? [],
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(review, { status: 201 });
}
