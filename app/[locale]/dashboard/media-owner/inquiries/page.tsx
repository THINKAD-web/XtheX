import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { MediaOwnerInquiryMessageCell } from "@/components/media-owner/MediaOwnerInquiryMessageCell";
import { MediaOwnerContractButton } from "@/components/media-owner/MediaOwnerContractButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Received Inquiries | XtheX",
  description: "Track incoming inquiries for your published media.",
  robots: { index: false, follow: false },
};

function statusPill(status: string) {
  if (status === "REPLIED") return "bg-emerald-600/10 text-emerald-800";
  if (status === "CLOSED") return "bg-zinc-600/10 text-zinc-800";
  return "bg-amber-500/10 text-amber-900";
}

export default async function MediaOwnerInquiriesPage() {
  const user = await gateMediaOwnerDashboard();
  const t = await getTranslations("dashboard.mediaOwner");
  const locale = await getLocale();

  const rows = await prisma.inquiry.findMany({
    where: {
      media: {
        createdById: user.id,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      contract: { select: { id: true, status: true, advertiserSignedAt: true, mediaOwnerSignedAt: true } },
      media: { select: { id: true, mediaName: true, category: true } },
      advertiser: { select: { id: true, email: true } },
    },
  });

  return (
    <div className={`${landing.container} space-y-6 py-10 lg:py-14`}>
        <Link
          href="/dashboard/media-owner"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← {t("back_dashboard")}
        </Link>
        <div
          className={`${landing.surface} border-sky-100/80 p-8 dark:border-zinc-700`}
        >
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("inquiries_title")}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {t("inquiries_subtitle")}
          </p>

          <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Media</th>
                  <th className="px-4 py-3">Advertiser</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Thread</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/medias/${r.media.id}`}
                        className="font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                      >
                        {r.media.mediaName}
                      </Link>
                      <div className="text-xs uppercase text-zinc-500">
                        {String(r.media.category)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {r.advertiser.email}
                      </div>
                      {r.contactEmail ? (
                        <div className="text-xs text-zinc-500">{r.contactEmail}</div>
                      ) : null}
                      {r.contactPhone ? (
                        <div className="text-xs text-zinc-500">{r.contactPhone}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`inline-flex rounded-full px-2 py-1 font-medium ${statusPill(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.budget != null ? `${r.budget.toLocaleString()}원` : "—"}
                    </td>
                    <td className="px-4 py-3">{r.desiredPeriod ?? "—"}</td>
                    <td className="px-4 py-3 align-top">
                      <MediaOwnerInquiryMessageCell
                        message={r.message}
                        sensitiveEnvelope={r.sensitiveEnvelope}
                        e2eEncrypted={r.e2eEncrypted}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {r.createdAt.toLocaleString(locale)}
                    </td>
                    <td className="px-4 py-3">
                      <MediaOwnerContractButton
                        locale={locale}
                        inquiryId={r.id}
                        contract={
                          r.contract
                            ? {
                                id: r.contract.id,
                                status: r.contract.status,
                                advertiserSignedAt:
                                  r.contract.advertiserSignedAt?.toISOString() ?? null,
                                mediaOwnerSignedAt:
                                  r.contract.mediaOwnerSignedAt?.toISOString() ?? null,
                              }
                            : null
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/media-owner/inquiries/${r.id}`}
                        className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-zinc-500">
                      {t("inquiries_placeholder")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
