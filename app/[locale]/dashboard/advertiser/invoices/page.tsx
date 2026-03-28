import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CampaignInvoiceStatus } from "@prisma/client";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoices | XtheX",
  description: "Campaign invoices and payment due dates.",
  robots: { index: false, follow: false },
};

function statusClass(s: CampaignInvoiceStatus) {
  if (s === CampaignInvoiceStatus.PAID) {
    return "bg-emerald-600/10 text-emerald-800 dark:text-emerald-200";
  }
  if (s === CampaignInvoiceStatus.VOID) {
    return "bg-zinc-600/10 text-zinc-700 dark:text-zinc-300";
  }
  return "bg-amber-500/10 text-amber-900 dark:text-amber-100";
}

export default async function AdvertiserInvoicesPage() {
  const user = await gateAdvertiserDashboard();
  const t = await getTranslations("dashboard.invoices");

  const rows = await prisma.campaignInvoice.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      campaign: { select: { id: true, title: true, status: true } },
    },
  });

  return (
    <DashboardChrome>
      <div className={`${landing.container} space-y-6 py-10 lg:py-14`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("subtitle")}
            </p>
          </div>
          <Link
            href="/dashboard/advertiser"
            className="text-sm font-medium text-blue-700 hover:underline dark:text-sky-300"
          >
            ← {t("back")}
          </Link>
        </div>

        <div className={`${landing.surface} border-sky-100/80 p-6 dark:border-zinc-700`}>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-[800px] w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">{t("col_campaign")}</th>
                  <th className="px-4 py-3">{t("col_amount")}</th>
                  <th className="px-4 py-3">{t("col_end")}</th>
                  <th className="px-4 py-3">{t("col_due")}</th>
                  <th className="px-4 py-3">{t("col_status")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {r.campaign.title?.trim() || t("untitled")}
                      </span>
                      <div className="text-xs text-zinc-500">{r.campaign.status}</div>
                    </td>
                    <td className="px-4 py-3">
                      {r.amountKrw.toLocaleString()} {t("krw")}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                      {r.campaignEndAt.toISOString().slice(0, 10)} UTC
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                      {r.dueAt.toISOString().slice(0, 10)} UTC
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass(r.status)}`}
                      >
                        {r.status === CampaignInvoiceStatus.OPEN
                          ? t("status_open")
                          : r.status === CampaignInvoiceStatus.PAID
                            ? t("status_paid")
                            : t("status_void")}
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                      {t("empty")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-zinc-500">{t("footer_hint")}</p>
        </div>
      </div>
    </DashboardChrome>
  );
}
