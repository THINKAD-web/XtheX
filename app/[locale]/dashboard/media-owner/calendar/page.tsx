import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { MediaOwnerCalendarClient } from "@/components/dashboard/MediaOwnerCalendarClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking calendar | XtheX",
  robots: { index: false, follow: false },
};

export default async function MediaOwnerCalendarPage() {
  const user = await gateMediaOwnerDashboard();
  const locale = await getLocale();
  const isKo = locale.startsWith("ko");

  const medias = await prisma.media.findMany({
    where: { createdById: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, mediaName: true },
    take: 200,
  });

  return (
    <div className={`${landing.container} space-y-6 py-10 lg:py-14`}>
      <Link
        href="/dashboard/media-owner"
        className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        ← {isKo ? "대시보드" : "Dashboard"}
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {isKo ? "예약 · 가용 캘린더" : "Booking & availability calendar"}
      </h1>
      {medias.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {isKo ? "먼저 매체를 등록하세요." : "Register media first."}
        </p>
      ) : (
        <MediaOwnerCalendarClient
          medias={medias}
          labels={{
            title: isKo ? "일정 추가" : "Add event",
            media: isKo ? "매체" : "Media",
            from: isKo ? "시작일" : "From",
            to: isKo ? "종료일" : "To",
            kind: isKo ? "유형" : "Type",
            note: isKo ? "메모" : "Note",
            add: isKo ? "추가" : "Add",
            load: isKo ? "새로고침" : "Refresh",
            delete: isKo ? "삭제" : "Delete",
            empty: isKo ? "일정이 없습니다." : "No events in range.",
          }}
        />
      )}
    </div>
  );
}
