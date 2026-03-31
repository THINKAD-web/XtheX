import {
  AdvertiserLedgerKind,
  InquiryStatus,
  InquiryStripePaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function fulfillInquiryStripeCheckout(input: {
  inquiryPaymentId: string;
  stripePaymentIntentId?: string | null;
  paidAt: Date;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const pay = await tx.inquiryStripePayment.findUnique({
        where: { id: input.inquiryPaymentId },
        include: { inquiry: true },
      });
      if (!pay) {
        throw new Error("payment_not_found");
      }
      if (pay.status === InquiryStripePaymentStatus.PAID) {
        return;
      }
      await tx.inquiryStripePayment.update({
        where: { id: pay.id },
        data: {
          status: InquiryStripePaymentStatus.PAID,
          paidAt: input.paidAt,
          ...(input.stripePaymentIntentId
            ? { stripePaymentIntentId: input.stripePaymentIntentId }
            : {}),
        },
      });
      await tx.inquiry.update({
        where: { id: pay.inquiryId },
        data: { status: InquiryStatus.REPLIED },
      });
      const existingLedger = await tx.advertiserLedgerEntry.findFirst({
        where: { inquiryStripePaymentId: pay.id },
      });
      if (!existingLedger) {
        await tx.advertiserLedgerEntry.create({
          data: {
            userId: pay.inquiry.advertiserId,
            kind: AdvertiserLedgerKind.INQUIRY_CHECKOUT_PAYMENT,
            amountKrw: pay.amountKrw,
            description: "Inquiry contract payment (Stripe)",
            inquiryId: pay.inquiryId,
            inquiryStripePaymentId: pay.id,
          },
        });
      }
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "payment_not_found") return { ok: false, reason: "not_found" };
    return { ok: false, reason: msg };
  }
}
