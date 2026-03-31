import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { fulfillInquiryStripeCheckout } from "@/lib/stripe/fulfill-inquiry-payment";
import { getStripe } from "@/lib/stripe/server";
import { syncInquiryRefundFromStripeRefundObject } from "@/lib/stripe/sync-inquiry-refund-webhook";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Misconfigured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const inquiryPaymentId =
      session.metadata?.inquiryPaymentId ?? session.client_reference_id ?? null;
    if (inquiryPaymentId) {
      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
      await fulfillInquiryStripeCheckout({
        inquiryPaymentId,
        stripePaymentIntentId: pi,
        paidAt: new Date(),
      });
      revalidatePath("/dashboard/advertiser/inquiries");
      revalidatePath("/ko/dashboard/advertiser/inquiries");
      revalidatePath("/en/dashboard/advertiser/inquiries");
    }
  }

  if (event.type === "refund.created" || event.type === "refund.updated") {
    const refund = event.data.object as Stripe.Refund;
    await syncInquiryRefundFromStripeRefundObject(refund);
    revalidatePath("/dashboard/advertiser/inquiries");
    revalidatePath("/dashboard/media-owner/revenue");
    revalidatePath("/ko/dashboard/media-owner/revenue");
    revalidatePath("/en/dashboard/media-owner/revenue");
  }

  return NextResponse.json({ received: true });
}
