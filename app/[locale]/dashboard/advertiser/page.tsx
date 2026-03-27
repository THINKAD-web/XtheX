import { CampaignStatus } from "@prisma/client";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Activity, CheckCircle, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";
import { DashboardStatsSection } from "@/components/dashboard/DashboardStatsSection";
import { DashboardNotificationBanner } from "@/components/layout/DashboardNotificationBanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Advertiser Dashboard | XtheX",
  description: "Track inquiries, campaigns, and performance as an advertiser.",
  robots: { index: false, follow: false },
};

function statusLabel(
  status: CampaignStatus,
  t: Awaited<ReturnType<typeof getTranslations>>,
): string {
  switch (status) {
    case "DRAFT":
      return t("status_draft");
    case "SUBMITTED":
      return t("status_submitted");
    case "APPROVED":
      return t("status_approved");
    case "REJECTED":
      return t("status_rejected");
    default:
      return status;
  }
}

export default async function AdvertiserDashboardPage() {
  const user = await gateAdvertiserDashboard();
  const t = await getTranslations("dashboard.advertiser");
  const locale = await getLocale();

  const displayName =
    user.name?.trim() ||
    (user.email?.includes("@") ? user.email.split("@")[0] : user.email) ||
    t("default_name");

  const [recentCampaigns, activeCount, completedCount, pendingCount] =
    await Promise.all([
      prisma.campaign.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, createdAt: true },
      }),
      prisma.campaign.count({
        where: { userId: user.id, status: "APPROVED" },
      }),
      prisma.campaign.count({
        where: { userId: user.id, status: "REJECTED" },
      }),
      prisma.campaign.count({
        where: {
          userId: user.id,
          status: { in: ["DRAFT", "SUBMITTED"] },
        },
      }),
    ]);

  return (
      <main className={`${landing.container} space-y-10 py-10 lg:space-y-12 lg:py-14`}>
        <DashboardNotificationBanner message="캠페인 진행 현황을 확인하세요" />
        <section className="relative overflow-hidden rounded-3xl border border-sky-200/60 bg-gradient-to-br from-white via-sky-50/50 to-emerald-50/40 p-8 shadow-lg dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-emerald-950/30 dark:shadow-black/30 lg:p-10">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"
            aria-hidden
          />
          <h1 className="relative text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
            {t("hero", { name: displayName })}
          </h1>
          <p className="relative mt-3 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("card_active")}</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("card_completed")}</p>
              <p className="text-2xl font-bold">{completedCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("card_pending")}</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>
        </section>

        <DashboardStatsSection role="ADVERTISER" />

        <section aria-labelledby="advertiser-quick-actions">
          <h2 id="advertiser-quick-actions" className="sr-only">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/campaigns/new"
              className={`${landing.card} flex min-h-[120px] flex-col justify-center border-sky-200/50 bg-white/90 text-center dark:border-sky-900/30`}
            >
              <span className="text-sm font-semibold text-blue-700 dark:text-sky-300">
                {t("quick_new_campaign")}
              </span>
            </Link>
            <Link
              href="/dashboard/advertiser/explore"
              className={`${landing.card} flex min-h-[120px] flex-col justify-center border-cyan-200/50 bg-white/90 text-center dark:border-cyan-900/30`}
            >
              <span className="text-sm font-semibold text-cyan-800 dark:text-cyan-300">
                {t("quick_explore_map")}
              </span>
            </Link>
            <Link
              href="/dashboard/advertiser/recommend"
              className={`${landing.card} flex min-h-[120px] flex-col justify-center border-emerald-200/50 bg-white/90 text-center dark:border-emerald-900/30`}
            >
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {t("quick_ai_recommend")}
              </span>
            </Link>
            <Link
              href="/dashboard/advertiser/campaigns"
              className={`${landing.card} flex min-h-[120px] flex-col justify-center bg-white/90 text-center`}
            >
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t("quick_view_campaigns")}
              </span>
            </Link>
          </div>
        </section>

        <section
          className={`${landing.surface} border-sky-100/80 dark:border-zinc-700`}
          aria-labelledby="recent-activity"
        >
          <h2
            id="recent-activity"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {t("recent_title")}
          </h2>
          {recentCampaigns.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-emerald-300/50 bg-emerald-50/30 px-6 py-10 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="font-medium text-zinc-800 dark:text-zinc-200">
                {t("recent_empty")}
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t("recent_subtitle")}
              </p>
              <Link
                href="/campaigns/new"
                className={`${landing.btnPrimary} mt-6 inline-flex min-w-0`}
              >
                {t("quick_new_campaign")}
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {recentCampaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                      {c.title?.trim() || t("untitled")}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {statusLabel(c.status, t)} ·{" "}
                      {c.createdAt.toLocaleDateString(locale, {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/campaign/${c.id}`}
                    className="shrink-0 text-sm font-medium text-blue-600 hover:underline dark:text-sky-400"
                  >
                    {t("view_detail")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
  );
}
