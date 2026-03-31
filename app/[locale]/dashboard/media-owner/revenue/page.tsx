import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { getMediaOwnerRevenueSummary } from "@/lib/media-owner/revenue-summary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Revenue | XtheX",
  robots: { index: false, follow: false },
};

export default async function MediaOwnerRevenuePage() {
  const user = await gateMediaOwnerDashboard();
  const locale = await getLocale();
  const isKo = locale.startsWith("ko");

  const { totalKrw, rows } = await getMediaOwnerRevenueSummary(user.id);

  return (
    <div className={`${landing.container} space-y-6 py-10 lg:py-14`}>
      <Link
        href="/dashboard/media-owner"
        className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        ← {isKo ? "대시보드" : "Dashboard"}
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {isKo ? "수익 (Stripe + 개발 원장)" : "Revenue (Stripe + dev ledger)"}
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {isKo
          ? "Stripe 결제 완료 건과, 로컬 mock 결제로 쌓인 원장(Stripe 미연동)을 합산합니다."
          : "Includes paid Stripe checkouts and dev-only ledger lines from mock payments (no Stripe link)."}
      </p>
      <div className={`${landing.surface} max-w-lg border-emerald-100/80 p-6 dark:border-zinc-700`}>
        <p className="text-sm text-zinc-500">{isKo ? "누적 (KRW)" : "Lifetime (KRW)"}</p>
        <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-400">
          {totalKrw.toLocaleString(isKo ? "ko-KR" : "en-US")}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          {isKo ? `${rows.length}건` : `${rows.length} line(s)`}
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs dark:bg-zinc-900">
            <tr>
              <th className="px-3 py-2">{isKo ? "출처" : "Source"}</th>
              <th className="px-3 py-2">{isKo ? "매체" : "Media"}</th>
              <th className="px-3 py-2">{isKo ? "금액" : "Amount"}</th>
              <th className="px-3 py-2">{isKo ? "일시" : "When"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-3 py-2 text-xs uppercase text-zinc-500">
                  {r.source === "stripe"
                    ? "Stripe"
                    : isKo
                      ? "Mock 원장"
                      : "Mock ledger"}
                </td>
                <td className="px-3 py-2">{r.mediaName}</td>
                <td className="px-3 py-2">{r.amountKrw.toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-zinc-500">
                  {r.at.toLocaleString(locale)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-zinc-500">
                  {isKo ? "아직 결제·원장 내역이 없습니다." : "No payments or ledger lines yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
