import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/rbac";

type Ctx = { params: Promise<{ id: string }> };

const MAX_REASON = 2000;

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: reviewId } = await ctx.params;

  const review = await prisma.mediaReview.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true, visible: true },
  });

  if (!review || !review.visible) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (review.userId === user.id) {
    return NextResponse.json({ error: "Cannot report your own review" }, { status: 400 });
  }

  let reason: string | null = null;
  try {
    const body = (await req.json()) as unknown;
    if (body && typeof body === "object" && "reason" in body) {
      const r = (body as { reason?: unknown }).reason;
      if (typeof r === "string" && r.trim()) {
        reason = r.trim().slice(0, MAX_REASON);
      }
    }
  } catch {
    // optional body
  }

  try {
    await prisma.mediaReviewReport.create({
      data: {
        reviewId: review.id,
        reporterId: user.id,
        reason,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Already reported" }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
