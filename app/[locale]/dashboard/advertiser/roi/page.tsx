import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ROI snapshot | XtheX",
  robots: { index: false, follow: false },
};

export default async function AdvertiserRoiPage() {
  const user = await gateAdvertiserDashboard();
  const locale = await getLocale();
  const isKo = locale.startsWith("ko");

  const [spentAgg, plannedAgg, campaigns] = await Promise.all([
    prisma.advertiserLedgerEntry.aggregate({
      where: { userId: user.id },
      _sum: { amountKrw: true },
    }),
    prisma.campaign.aggregate({
      where: { userId: user.id, status: "APPROVED" },
      _sum: { budget_krw: true },
    }),
    prisma.campaign.count({ where: { userId: user.id, status: "APPROVED" } }),
  ]);

  const spent = spentAgg._sum.amountKrw ?? 0;
  const planned = plannedAgg._sum.budget_krw ?? 0;
  const utilization = planned > 0 ? Math.min(1, spent / planned) : null;
  const roiScore =
    planned > 0 && spent > 0
      ? Math.round((planned / spent) * 50 + Math.min(50, campaigns * 5))
      : null;

  return (
    <div className={`${landing.container} space-y-6 py-10 lg:py-14`}>
      <Link
        href="/dashboard/advertiser"
        className="text-sm font-medium text-blue-700 hover:underline dark:text-sky-300"
      >
        ← {isKo ? "대시보드" : "Dashboard"}
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {isKo ? "ROI 스냅샷" : "ROI snapshot"}
      </h1>
      <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        {isKo
          ? "승인된 캠페인 예산 대비 실제 문의 결제(원장) 비율과 간단 점수입니다. 인상·전환 데이터가 연결되면 정밀해집니다."
          : "Compare approved campaign budgets to recorded inquiry payments. Replace with attribution data when available."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className={`${landing.surface} border-sky-100/80 p-5 dark:border-zinc-700`}>
          <p className="text-xs text-zinc-500">{isKo ? "실제 지출" : "Cash out (ledger)"}</p>
          <p className="mt-1 text-2xl font-semibold">{spent.toLocaleString()} KRW</p>
        </div>
        <div className={`${landing.surface} border-sky-100/80 p-5 dark:border-zinc-700`}>
          <p className="text-xs text-zinc-500">{isKo ? "승인 캠페인 예산 합" : "Approved budget sum"}</p>
          <p className="mt-1 text-2xl font-semibold">{planned.toLocaleString()} KRW</p>
        </div>
        <div className={`${landing.surface} border-sky-100/80 p-5 dark:border-zinc-700`}>
          <p className="text-xs text-zinc-500">{isKo ? "예산 대비 지출" : "Spend / budget"}</p>
          <p className="mt-1 text-2xl font-semibold">
            {utilization != null ? `${Math.round(utilization * 100)}%` : "—"}
          </p>
        </div>
        <div className={`${landing.surface} border-emerald-100/80 p-5 dark:border-zinc-700 sm:col-span-2`}>
          <p className="text-xs text-zinc-500">{isKo ? "휴리스틱 ROI 점수" : "Heuristic ROI score"}</p>
          <p className="mt-1 text-2xl font-semibold">{roiScore ?? "—"}</p>
          <p className="mt-2 text-xs text-zinc-500">
            {isKo ? `승인 캠페인 ${campaigns}건 반영` : `${campaigns} approved campaigns in mix`}
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/advertiser/campaign-analytics"
        className="text-sm font-medium text-blue-600 hover:underline dark:text-sky-400"
      >
        {isKo ? "캠페인 분석으로 →" : "Campaign analytics →"}
      </Link>
    </div>
  );
}
