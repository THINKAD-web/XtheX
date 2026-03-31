import { NextResponse } from "next/server";
import { InquiryStripePaymentStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth/session";
import { findUserById } from "@/lib/auth/find-user-by-clerk";
import { getStripe } from "@/lib/stripe/server";
import { syncInquiryRefundFromStripeRefundObject } from "@/lib/stripe/sync-inquiry-refund-webhook";

export const runtime = "nodejs";

const bodySchema = z.object({
  /** 생략 시 잔액 전액 환불(KRW). */
  amountKrw: z.coerce.number().int().positive().optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ inquiryId: string }> },
) {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dbUser = await findUserById(session.user.id);
  if (!dbUser || dbUser.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 501 });
  }

  const { inquiryId } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    json = {};
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: { stripePayment: true },
  });
  if (!inquiry?.stripePayment) {
    return NextResponse.json({ error: "No Stripe payment for inquiry" }, { status: 400 });
  }
  const pay = inquiry.stripePayment;
  if (!pay.stripePaymentIntentId) {
    return NextResponse.json({ error: "No Stripe payment for inquiry" }, { status: 400 });
  }
  const stripePaymentIntentId = pay.stripePaymentIntentId;
  if (
    pay.status !== InquiryStripePaymentStatus.PAID &&
    pay.status !== InquiryStripePaymentStatus.PARTIALLY_REFUNDED
  ) {
    return NextResponse.json({ error: "Payment is not refundable in this state" }, { status: 400 });
  }

  const room = pay.amountKrw - pay.refundedAmountKrw;
  if (room <= 0) {
    return NextResponse.json({ error: "Nothing left to refund" }, { status: 400 });
  }

  const requested = parsed.data.amountKrw ?? room;
  const refundKrw = Math.min(requested, room);

  const refund = await stripe.refunds.create({
    payment_intent: stripePaymentIntentId,
    amount: refundKrw,
  });

  const synced = await syncInquiryRefundFromStripeRefundObject(refund);
  if (!synced.ok && refund.status === "succeeded") {
    return NextResponse.json(
      { error: "Refund created in Stripe but ledger sync failed", detail: synced.reason },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    refundId: refund.id,
    status: refund.status,
    amountKrw: refundKrw,
  });
}
