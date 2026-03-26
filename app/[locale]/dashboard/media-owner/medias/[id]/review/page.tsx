import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { MediaStatus } from "@prisma/client";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { prisma } from "@/lib/prisma";
import { landing } from "@/lib/landing-theme";
import { MediaReviewForm } from "@/components/admin/review/media-review-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaOwnerPendingReviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const user = await gateMediaOwnerDashboard();
  const { locale, id } = await params;

  const media = await prisma.media.findFirst({
    where: {
      id,
      createdById: user.id,
    },
    include: {
      createdBy: { select: { id: true, email: true, name: true } },
    },
  });

  if (!media) {
    notFound();
  }

  if (media.status === MediaStatus.DRAFT) {
    redirect(`/${locale}/dashboard/media-owner/medias/${id}/edit`);
  }
  if (media.status === MediaStatus.ARCHIVED) {
    redirect(`/${locale}/dashboard/media-owner/medias`);
  }

  return (
    <main className={`${landing.container} space-y-6 py-10 lg:py-14`}>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link
          href={`/${locale}/dashboard/media-owner/medias`}
          className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← 내 매체 목록
        </Link>
        <Link
          href={`/${locale}/dashboard/media-owner/upload`}
          className="text-zinc-500 hover:text-zinc-300"
        >
          새 등록
        </Link>
      </div>
      <MediaReviewForm media={media} locale={locale} mode="owner_pending" />
    </main>
  );
}
