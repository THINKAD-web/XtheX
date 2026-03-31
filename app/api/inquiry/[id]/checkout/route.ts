import { NextResponse } from "next/server";
import { InquiryContractStatus, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth/config";
import { getAppOriginUrl } from "@/lib/payments/app-origin";
import { resolveInquiryCheckoutAmountKrw } from "@/lib/payments/inquiry-checkout-amount";
import { prisma } from "@/lib/prisma";
import { inquiryHasSettledStripePayment } from "@/lib/payments/inquiry-stripe-paid";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured", useMock: true },
      { status: 501 },
    );
  }

  const { id: inquiryId } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id?.trim() || null;
  const role = session?.user?.role ?? null;
  if (!userId || role !== UserRole.ADVERTISER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let locale = "ko";
  try {
    const body = (await req.json()) as { locale?: string };
    if (typeof body?.locale === "string" && body.locale.trim()) {
      locale = body.locale.trim().split("/")[0] ?? "ko";
    }
  } catch {
    /* optional body */
  }

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, advertiserId: userId },
    include: { contract: true, stripePayment: true },
  });
  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (inquiry.contract?.status !== InquiryContractStatus.COMPLETED) {
    return NextResponse.json(
      { error: "Contract must be completed before payment" },
      { status: 400 },
    );
  }
  if (inquiryHasSettledStripePayment(inquiry.stripePayment?.status)) {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const amountKrw = resolveInquiryCheckoutAmountKrw(inquiry);
  const origin = getAppOriginUrl();
  const successUrl = `${origin}/${locale}/dashboard/advertiser/inquiries?stripe=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/${locale}/dashboard/advertiser/inquiries?stripe=cancel`;

  const paymentRow =
    inquiry.stripePayment ??
    (await prisma.inquiryStripePayment.create({
      data: {
        inquiryId: inquiry.id,
        amountKrw,
        currency: "krw",
        status: "AWAITING_PAYMENT",
      },
    }));

  if (inquiryHasSettledStripePayment(paymentRow.status)) {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  await prisma.inquiryStripePayment.update({
    where: { id: paymentRow.id },
    data: { amountKrw },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "krw",
          unit_amount: amountKrw,
          product_data: {
            name: `XtheX media inquiry`,
            description: `Inquiry ${inquiry.id.slice(0, 8)}…`,
          },
        },
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: paymentRow.id,
    metadata: {
      inquiryPaymentId: paymentRow.id,
      inquiryId: inquiry.id,
      advertiserId: userId,
    },
  });

  await prisma.inquiryStripePayment.update({
    where: { id: paymentRow.id },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  });

  revalidatePath(`/${locale}/dashboard/advertiser/inquiries`);
  revalidatePath("/dashboard/advertiser/inquiries");

  return NextResponse.json({
    url: checkoutSession.url,
    sessionId: checkoutSession.id,
  });
}
