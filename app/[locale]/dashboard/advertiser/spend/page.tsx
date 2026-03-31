import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spend | XtheX",
  robots: { index: false, follow: false },
};

export default async function AdvertiserSpendPage() {
  const user = await gateAdvertiserDashboard();
  const locale = await getLocale();
  const isKo = locale.startsWith("ko");

  const [entries, sum] = await Promise.all([
    prisma.advertiserLedgerEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.advertiserLedgerEntry.aggregate({
      where: { userId: user.id },
      _sum: { amountKrw: true },
    }),
  ]);

  const total = sum._sum.amountKrw ?? 0;

  return (
    <div className={`${landing.container} space-y-6 py-10 lg:py-14`}>
      <Link
        href="/dashboard/advertiser"
        className="text-sm font-medium text-blue-700 hover:underline dark:text-sky-300"
      >
        ← {isKo ? "대시보드" : "Dashboard"}
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {isKo ? "지출 내역" : "Spend history"}
      </h1>
      <div className={`${landing.surface} max-w-lg border-sky-100/80 p-6 dark:border-zinc-700`}>
        <p className="text-sm text-zinc-500">{isKo ? "누적 지출 (KRW)" : "Total spent (KRW)"}</p>
        <p className="mt-1 text-3xl font-bold text-blue-700 dark:text-sky-400">
          {total.toLocaleString(isKo ? "ko-KR" : "en-US")}
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">{isKo ? "일시" : "Date"}</th>
              <th className="px-3 py-2">{isKo ? "유형" : "Kind"}</th>
              <th className="px-3 py-2">{isKo ? "금액" : "Amount"}</th>
              <th className="px-3 py-2">{isKo ? "설명" : "Note"}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {e.createdAt.toLocaleString(locale)}
                </td>
                <td className="px-3 py-2">{e.kind}</td>
                <td className="px-3 py-2">{e.amountKrw.toLocaleString()}</td>
                <td className="px-3 py-2 text-zinc-600">{e.description ?? "—"}</td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-zinc-500">
                  {isKo ? "아직 지출 기록이 없습니다." : "No spend recorded yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
