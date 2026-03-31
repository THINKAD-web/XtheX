import type Stripe from "stripe";
import {
  applyInquiryStripeRefundRecord,
  resolveInquiryPaymentIdByStripePaymentIntent,
} from "@/lib/stripe/apply-inquiry-refund";

export async function syncInquiryRefundFromStripeRefundObject(
  refund: Stripe.Refund,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (refund.status !== "succeeded") {
    return { ok: true };
  }
  const pi =
    typeof refund.payment_intent === "string"
      ? refund.payment_intent
      : refund.payment_intent?.id ?? null;
  if (!pi) {
    return { ok: false, reason: "no_payment_intent" };
  }
  const paymentId = await resolveInquiryPaymentIdByStripePaymentIntent(pi);
  if (!paymentId) {
    return { ok: false, reason: "unknown_payment_intent" };
  }
  return applyInquiryStripeRefundRecord({
    inquiryStripePaymentId: paymentId,
    stripeRefundId: refund.id,
    refundAmountKrw: refund.amount,
  });
}
