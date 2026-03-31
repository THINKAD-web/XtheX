import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  AdvertiserLedgerKind,
  InquiryStripePaymentStatus,
} from "@prisma/client";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { InquiryThreadPanel } from "@/components/inquiry/InquiryThreadPanel";
import { InquiryCompletionReviewForm } from "@/components/inquiry/InquiryCompletionReviewForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inquiry thread | XtheX",
  robots: { index: false, follow: false },
};

export default async function AdvertiserInquiryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; inquiryId: string }>;
}) {
  const { inquiryId } = await params;
  const user = await gateAdvertiserDashboard();
  const locale = await getLocale();
  const isKo = locale.startsWith("ko");

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: inquiryId, advertiserId: user.id },
    include: {
      media: { select: { id: true, mediaName: true } },
      contract: true,
      stripePayment: true,
      completionReview: true,
    },
  });
  if (!inquiry) notFound();

  const paidLedger = await prisma.advertiserLedgerEntry.findFirst({
    where: {
      inquiryId: inquiry.id,
      userId: user.id,
      kind: AdvertiserLedgerKind.INQUIRY_CHECKOUT_PAYMENT,
    },
  });
  const paid =
    inquiry.stripePayment?.status === InquiryStripePaymentStatus.PAID || !!paidLedger;
  const showReview = paid && !inquiry.completionReview;

  return (
    <DashboardChrome>
      <div className={`${landing.container} space-y-6 py-10 lg:py-14`}>
        <Link
          href="/dashboard/advertiser/inquiries"
          className="text-sm font-medium text-blue-700 hover:underline dark:text-sky-300"
        >
          ← {isKo ? "문의 목록" : "Back to inquiries"}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {isKo ? "문의 · 협상" : "Inquiry · negotiation"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {inquiry.media.mediaName} · {inquiry.status}
            {paid ? (isKo ? " · 결제 완료" : " · Paid") : ""}
          </p>
        </div>

        <InquiryThreadPanel
          inquiryId={inquiry.id}
          currentUserId={user.id}
          labels={{
            title: isKo ? "메시지 스레드" : "Message thread",
            placeholder: isKo ? "견적·일정을 조율하세요…" : "Negotiate schedule or quote…",
            send: isKo ? "보내기" : "Send",
            attachmentHint: isKo ? "https://… (Cloudinary 등)" : "https://… (file URL)",
            empty: isKo ? "아직 메시지가 없습니다." : "No messages yet.",
          }}
        />

        {showReview ? (
          <InquiryCompletionReviewForm
            inquiryId={inquiry.id}
            labels={{
              title: isKo ? "캠페인 후기" : "Post-payment review",
              ratingLabel: isKo ? "별점" : "Rating",
              commentPlaceholder: isKo ? "매체 집행 경험을 남겨주세요." : "Share your experience.",
              submit: isKo ? "리뷰 제출" : "Submit review",
              done: isKo ? "리뷰가 등록되었습니다." : "Thanks — your review was saved.",
            }}
          />
        ) : null}
      </div>
    </DashboardChrome>
  );
}
