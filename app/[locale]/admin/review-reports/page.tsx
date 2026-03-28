import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ensureAdminUserFromSession } from "@/lib/auth/ensure-admin-from-session";
import { MediaReviewReportStatus } from "@prisma/client";
import {
  AdminMediaReviewReportsClient,
  type AdminMediaReviewReportRow,
} from "@/components/admin/AdminMediaReviewReportsClient";
import { getTranslations } from "next-intl/server";

export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.reviewReports");
  return {
    title: t("meta_title"),
    description: t("meta_description"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminMediaReviewReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await ensureAdminUserFromSession();
  await params;
  const t = await getTranslations("admin.reviewReports");
  const reports = await prisma.mediaReviewReport.findMany({
    where: { status: MediaReviewReportStatus.PENDING },
    orderBy: { createdAt: "asc" },
    include: {
      reporter: { select: { name: true, email: true } },
      review: {
        select: {
          id: true,
          rating: true,
          content: true,
          user: { select: { name: true, email: true } },
          media: { select: { id: true, mediaName: true } },
        },
      },
    },
  });

  const rows: AdminMediaReviewReportRow[] = reports.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    reason: r.reason,
    reporterLabel: r.reporter.name ?? r.reporter.email,
    reviewId: r.review.id,
    reviewRating: r.review.rating,
    reviewContent: r.review.content,
    reviewAuthorLabel: r.review.user.name ?? r.review.user.email,
    mediaName: r.review.media.mediaName,
    mediaId: r.review.media.id,
  }));

  const labels = {
    empty: t("empty"),
    colDate: t("col_date"),
    colMedia: t("col_media"),
    colReview: t("col_review"),
    colReporter: t("col_reporter"),
    colReason: t("col_reason"),
    colActions: t("col_actions"),
    dismiss: t("dismiss"),
    hideReview: t("hide_review"),
    viewMedia: t("view_media"),
    pending: t("pending"),
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-100">{t("title")}</h1>
      <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
      <div className="mt-6">
        <AdminMediaReviewReportsClient rows={rows} labels={labels} />
      </div>
    </div>
  );
}
