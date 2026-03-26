import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { ContractRowActions } from "@/components/contract/ContractRowActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My Inquiries | XtheX",
  description: "Review your inquiries, contracts, and payment progress.",
  robots: { index: false, follow: false },
};

function statusPill(status: string) {
  if (status === "REPLIED") return "bg-emerald-600/10 text-emerald-800";
  if (status === "CLOSED") return "bg-zinc-600/10 text-zinc-800";
  return "bg-amber-500/10 text-amber-900";
}

export default async function AdvertiserInquiriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await gateAdvertiserDashboard();
  const t = await getTranslations("dashboard.advertiser");
  const locale = await getLocale();
  const sp = (await searchParams) ?? {};
  const status = typeof sp.status === "string" ? sp.status : "ALL";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const rows = await prisma.inquiry.findMany({
    where: {
      advertiserId: user.id,
      ...(status !== "ALL" ? { status: status as any } : {}),
      ...(q
        ? {
            OR: [
              { message: { contains: q, mode: "insensitive" } },
              { media: { mediaName: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      media: {
        select: {
          id: true,
          mediaName: true,
          category: true,
          price: true,
          locationJson: true,
        },
      },
    },
  });

  return (
    <DashboardChrome>
      <div className={`${landing.container} space-y-6 py-10 lg:py-14`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {t("inquiries_title") ?? "문의 내역"}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {t("inquiries_subtitle") ?? "보낸 문의를 확인하세요."}
            </p>
          </div>
          <Link
            href="/dashboard/advertiser"
            className="text-sm font-medium text-blue-700 hover:underline dark:text-sky-300"
          >
            ← {t("back_hub")}
          </Link>
        </div>

        <div className={`${landing.surface} border-sky-100/80 p-6 dark:border-zinc-700`}>
          <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search media / message"
              className="h-9 w-full max-w-xs rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="ALL">ALL</option>
              <option value="PENDING">PENDING</option>
              <option value="REPLIED">REPLIED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              Apply
            </button>
          </form>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Media</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Contract</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/medias/${r.media.id}`}
                        className="font-medium text-blue-700 hover:underline dark:text-sky-300"
                      >
                        {r.media.mediaName}
                      </Link>
                      <div className="text-xs uppercase text-zinc-500">
                        {String(r.media.category)}
                      </div>
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
                    <td className="px-4 py-3">
                      <span className="line-clamp-2">{r.message}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {r.createdAt.toLocaleString(locale)}
                    </td>
                    <td className="px-4 py-3">
                      <ContractRowActions
                        locale={locale}
                        advertiserEmail={user.email}
                        inquiry={{
                          id: r.id,
                          status: r.status,
                          message: r.message,
                          desiredPeriod: r.desiredPeriod,
                          budget: r.budget,
                          contactEmail: r.contactEmail,
                          contactPhone: r.contactPhone,
                          createdAtIso: r.createdAt.toISOString(),
                        }}
                        media={{
                          id: r.media.id,
                          name: r.media.mediaName,
                          type: String(r.media.category),
                          weeklyPriceKrw: r.media.price ?? null,
                          locationLabel:
                            typeof r.media.locationJson === "object" &&
                            r.media.locationJson != null &&
                            "address" in (r.media.locationJson as any) &&
                            typeof (r.media.locationJson as any).address === "string"
                              ? String((r.media.locationJson as any).address)
                              : "—",
                        }}
                      />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                      아직 문의가 없어요. 탐색에서 매체를 둘러보고 문의를 남겨보세요.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Contact: {user.email} · {rows.length} inquiries
          </p>
        </div>
      </div>
    </DashboardChrome>
  );
}

