import { NextResponse } from "next/server";
import { AdvertiserLedgerKind, InquiryStripePaymentStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: inquiryId } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || role !== UserRole.ADVERTISER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, advertiserId: userId },
    include: {
      stripePayment: true,
    },
  });
  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const paidStripe =
    inquiry.stripePayment?.status === InquiryStripePaymentStatus.PAID;
  const paidLedger = await prisma.advertiserLedgerEntry.findFirst({
    where: {
      inquiryId,
      userId,
      kind: AdvertiserLedgerKind.INQUIRY_CHECKOUT_PAYMENT,
    },
  });
  if (!paidStripe && !paidLedger) {
    return NextResponse.json(
      { error: "Complete payment before leaving a review" },
      { status: 400 },
    );
  }

  const existing = await prisma.inquiryCompletionReview.findUnique({
    where: { inquiryId },
  });
  if (existing) {
    return NextResponse.json({ error: "Review already submitted" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.inquiryCompletionReview.create({
      data: {
        inquiryId,
        advertiserId: userId,
        mediaId: inquiry.mediaId,
        rating: parsed.data.rating,
        comment: parsed.data.comment?.trim() || null,
      },
    });
    await tx.mediaReview.upsert({
      where: {
        mediaId_userId: { mediaId: inquiry.mediaId, userId },
      },
      create: {
        mediaId: inquiry.mediaId,
        userId,
        rating: parsed.data.rating,
        content: parsed.data.comment?.trim() || null,
        sourceInquiryId: inquiryId,
      },
      update: {
        rating: parsed.data.rating,
        content: parsed.data.comment?.trim() || null,
        sourceInquiryId: inquiryId,
      },
    });
    const agg = await tx.mediaReview.aggregate({
      where: { mediaId: inquiry.mediaId, visible: true },
      _avg: { rating: true },
      _count: { id: true },
    });
    const avg = agg._avg.rating;
    if (avg != null) {
      const m = await tx.media.findUnique({
        where: { id: inquiry.mediaId },
        select: { trustScore: true },
      });
      const computed = Math.round(Math.min(100, Math.max(0, (avg / 5) * 100)));
      await tx.media.update({
        where: { id: inquiry.mediaId },
        data: {
          trustScore: Math.max(m?.trustScore ?? 0, computed),
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
