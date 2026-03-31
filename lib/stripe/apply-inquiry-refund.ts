import {
  AdvertiserLedgerKind,
  InquiryStripePaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Stripe 환불 웹훅/관리자 API 공통: KRW 누적 환불·원장(음수)·상태 동기화.
 * 동일 stripeRefundId는 한 번만 반영 (원장 description 기준).
 */
export async function applyInquiryStripeRefundRecord(input: {
  inquiryStripePaymentId: string;
  stripeRefundId: string;
  refundAmountKrw: number;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const amt = Math.floor(input.refundAmountKrw);
  if (!Number.isFinite(amt) || amt <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }

  const descPrefix = `Stripe refund ${input.stripeRefundId}`;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.advertiserLedgerEntry.findFirst({
        where: {
          kind: AdvertiserLedgerKind.REFUND_INQUIRY_CHECKOUT,
          description: { startsWith: descPrefix },
        },
      });
      if (existing) return;

      const pay = await tx.inquiryStripePayment.findUnique({
        where: { id: input.inquiryStripePaymentId },
        include: { inquiry: true },
      });
      if (!pay) throw new Error("payment_not_found");
      if (
        pay.status !== InquiryStripePaymentStatus.PAID &&
        pay.status !== InquiryStripePaymentStatus.PARTIALLY_REFUNDED
      ) {
        throw new Error("invalid_payment_status");
      }

      const room = pay.amountKrw - pay.refundedAmountKrw;
      const delta = Math.min(amt, room);
      if (delta <= 0) return;

      const nextRefunded = pay.refundedAmountKrw + delta;
      const nextStatus =
        nextRefunded >= pay.amountKrw
          ? InquiryStripePaymentStatus.REFUNDED
          : InquiryStripePaymentStatus.PARTIALLY_REFUNDED;

      await tx.inquiryStripePayment.update({
        where: { id: pay.id },
        data: {
          refundedAmountKrw: nextRefunded,
          lastStripeRefundId: input.stripeRefundId,
          status: nextStatus,
        },
      });

      await tx.advertiserLedgerEntry.create({
        data: {
          userId: pay.inquiry.advertiserId,
          kind: AdvertiserLedgerKind.REFUND_INQUIRY_CHECKOUT,
          amountKrw: -delta,
          description: `${descPrefix} (inquiry payment ${pay.id})`,
          inquiryId: pay.inquiryId,
          inquiryStripePaymentId: null,
        },
      });
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "payment_not_found") return { ok: false, reason: "not_found" };
    if (msg === "invalid_payment_status") {
      return { ok: false, reason: "invalid_status" };
    }
    return { ok: false, reason: msg };
  }
}

export async function resolveInquiryPaymentIdByStripePaymentIntent(
  paymentIntentId: string,
): Promise<string | null> {
  const row = await prisma.inquiryStripePayment.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true },
  });
  return row?.id ?? null;
}
