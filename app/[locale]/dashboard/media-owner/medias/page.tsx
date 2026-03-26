import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { MediaStatus } from "@prisma/client";
import { MediaOwnerMediaActions } from "@/components/dashboard/MediaOwnerMediaActions";
import { MediaOwnerMediaStatusOutcome } from "@/components/dashboard/MediaOwnerMediaStatusOutcome";
import { MediaOwnerMediasFlowBanner } from "@/components/dashboard/MediaOwnerMediasFlowBanner";
import { MediaOwnerMediasRefreshOnFocus } from "@/components/dashboard/MediaOwnerMediasRefreshOnFocus";
import { cn } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "My Media Listings | XtheX",
  description: "Manage media statuses, edits, and listing details.",
  robots: { index: false, follow: false },
};

const FILTERS: { key: string; label: string; status?: MediaStatus }[] = [
  { key: "ALL", label: "전체" },
  { key: "PENDING", label: "PENDING", status: "PENDING" },
  { key: "PUBLISHED", label: "PUBLISHED", status: "PUBLISHED" },
  { key: "REJECTED", label: "REJECTED", status: "REJECTED" },
];

export default async function MediaOwnerMediasPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await gateMediaOwnerDashboard();
  const t = await getTranslations("dashboard.mediaOwner");

  const sp = (await searchParams) ?? {};
  const statusKey = typeof sp.status === "string" ? sp.status : "ALL";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const picked = FILTERS.find((f) => f.key === statusKey) ?? FILTERS[0]!;

  const medias = await prisma.media.findMany({
    where: {
      createdById: user.id,
      ...(picked.status ? { status: picked.status } : {}),
      ...(q
        ? {
            OR: [
              { mediaName: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      mediaName: true,
      category: true,
      status: true,
      parseHistory: true,
      adminMemo: true,
      viewCount: true,
      price: true,
      updatedAt: true,
    },
  });

  return (
    <div className={`${landing.container} space-y-8 py-10 lg:py-14`}>
        <MediaOwnerMediasRefreshOnFocus />
        <div className="sticky top-[56px] z-20 -mx-4 border-b border-zinc-200 bg-white/80 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Link
                href="/dashboard/media-owner"
                className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                ← {t("back_dashboard")}
              </Link>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                {t("medias_title")}
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {t("medias_subtitle")}
              </p>
              <div className="mt-4 max-w-2xl">
                <MediaOwnerMediasFlowBanner />
              </div>
            </div>
            <Link
              href="/dashboard/media-owner/upload"
              className={cn(landing.btnPrimary, "inline-flex")}
            >
              새 미디어 등록
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={{
                  pathname: "/dashboard/media-owner/medias",
                  query: {
                    ...(q ? { q } : {}),
                    ...(f.key !== "ALL" ? { status: f.key } : {}),
                  },
                }}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors",
                  f.key === statusKey
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
                )}
              >
                {f.label}
              </Link>
            ))}

            <form method="get" className="ml-auto flex w-full max-w-md items-center gap-2 sm:w-auto">
              <input
                name="q"
                defaultValue={q}
                placeholder="검색 (미디어 이름/설명)"
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              {statusKey !== "ALL" ? (
                <input type="hidden" name="status" value={statusKey} />
              ) : null}
              <button
                type="submit"
                className="inline-flex h-9 shrink-0 items-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                검색
              </button>
            </form>
          </div>
        </div>

        {medias.length === 0 ? (
          <div
            className={`${landing.card} border-dashed border-emerald-300/50 py-16 text-center dark:border-emerald-900/40`}
          >
            <p className="font-medium text-zinc-800 dark:text-zinc-200">
              {t("medias_empty")}
            </p>
            <Link
              href="/dashboard/media-owner/upload"
              className={`${landing.btnPrimary} mt-6 inline-flex`}
            >
              {t("medias_upload_cta")}
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:block">
              <table className="min-w-[980px] w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3">미디어</th>
                    <th className="px-5 py-3">상태</th>
                    <th className="px-5 py-3">가격(원)</th>
                    <th className="px-5 py-3">노출</th>
                    <th className="px-5 py-3">수정일</th>
                    <th className="px-5 py-3 text-right">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {medias.map((m) => (
                    <tr
                      key={m.id}
                      className="border-t border-zinc-200 dark:border-zinc-800"
                    >
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                            {m.mediaName}
                          </p>
                          <p className="mt-0.5 text-xs uppercase text-zinc-500">
                            {String(m.category)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <MediaOwnerMediaStatusOutcome
                          status={m.status}
                          parseHistory={m.parseHistory}
                          adminMemo={m.adminMemo}
                          mediaName={m.mediaName}
                        />
                      </td>
                      <td className="px-5 py-4">
                        {m.price != null ? m.price.toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-4">{t("medias_views", { count: m.viewCount })}</td>
                      <td className="px-5 py-4 text-xs text-zinc-500">
                        {m.updatedAt.toLocaleString("ko-KR")}
                      </td>
                      <td className="px-5 py-4">
                        <MediaOwnerMediaActions mediaId={m.id} status={m.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="grid gap-4 lg:hidden sm:grid-cols-2">
              {medias.map((m) => (
                <li
                  key={m.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                        {m.mediaName}
                      </p>
                      <p className="mt-1 text-xs uppercase text-zinc-500">
                        {String(m.category)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <MediaOwnerMediaStatusOutcome
                        status={m.status}
                        parseHistory={m.parseHistory}
                        adminMemo={m.adminMemo}
                        mediaName={m.mediaName}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                    <div>
                      <p className="text-[11px] font-medium text-zinc-500">주간 가격</p>
                      <p className="font-semibold">
                        {m.price != null ? `${m.price.toLocaleString()}원` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-zinc-500">노출</p>
                      <p className="font-semibold">{m.viewCount.toLocaleString()}회</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
                    <span>수정일</span>
                    <span>{m.updatedAt.toLocaleString("ko-KR")}</span>
                  </div>

                  <div className="mt-4">
                    <MediaOwnerMediaActions mediaId={m.id} status={m.status} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
  );
}
