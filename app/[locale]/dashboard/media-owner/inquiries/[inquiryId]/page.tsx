import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { InquiryThreadPanel } from "@/components/inquiry/InquiryThreadPanel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inquiry thread | XtheX",
  robots: { index: false, follow: false },
};

export default async function MediaOwnerInquiryDetailPage({
  params,
}: {
  params: Promise<{ locale: string; inquiryId: string }>;
}) {
  const { inquiryId } = await params;
  const user = await gateMediaOwnerDashboard();
  const locale = await getLocale();
  const isKo = locale.startsWith("ko");

  const inquiry = await prisma.inquiry.findFirst({
    where: {
      id: inquiryId,
      media: { createdById: user.id },
    },
    include: {
      media: { select: { id: true, mediaName: true } },
      advertiser: { select: { email: true } },
    },
  });
  if (!inquiry) notFound();

  return (
    <div className={`${landing.container} space-y-6 py-10 lg:py-14`}>
      <Link
        href="/dashboard/media-owner/inquiries"
        className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        ← {isKo ? "문의 목록" : "Back to inquiries"}
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {isKo ? "문의 · 협상" : "Inquiry · negotiation"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {inquiry.media.mediaName} · {inquiry.advertiser.email}
        </p>
      </div>
      <InquiryThreadPanel
        inquiryId={inquiry.id}
        currentUserId={user.id}
        labels={{
          title: isKo ? "메시지 스레드" : "Message thread",
          placeholder: isKo ? "광고주에게 답장하세요…" : "Reply to the advertiser…",
          send: isKo ? "보내기" : "Send",
          attachmentHint: isKo ? "https://…" : "https://…",
          empty: isKo ? "아직 메시지가 없습니다." : "No messages yet.",
        }}
      />
    </div>
  );
}
