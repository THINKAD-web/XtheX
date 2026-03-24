import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MediaOwnerMapPreview } from "@/components/dashboard/media-owner-map-preview";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaOwnerDashboardPage() {
  const user = await gateMediaOwnerDashboard();
  const t = await getTranslations("dashboard.mediaOwner");

  const displayName =
    user.name?.trim() ||
    (user.email?.includes("@") ? user.email.split("@")[0] : user.email) ||
    t("default_name");

  const [registered, pendingDrafts, impressionsAgg] = await Promise.all([
    prisma.media.count({ where: { createdById: user.id } }),
    prisma.media.count({
      where: { createdById: user.id, status: "DRAFT" },
    }),
    prisma.media.aggregate({
      where: { createdById: user.id },
      _sum: { viewCount: true },
    }),
  ]);

  const totalViews = impressionsAgg._sum.viewCount ?? 0;

  const stats = [
    { label: t("stat_registered"), value: registered },
    { label: t("stat_pending"), value: pendingDrafts },
    { label: t("stat_impressions"), value: totalViews },
  ];

  return (
    <DashboardChrome>
      <main className={`${landing.container} space-y-10 py-10 lg:space-y-12 lg:py-14`}>
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/50 p-8 shadow-lg dark:border-zinc-700 dark:from-zinc-900 dark:via-emerald-950/25 dark:to-zinc-900/90 dark:shadow-black/30 lg:p-10">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 left-0 h-44 w-44 rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10"
            aria-hidden
          />
          <h1 className="relative text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
            {t("hero", { name: displayName })}
          </h1>
          <p className="relative mt-3 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </section>

        <section aria-labelledby="media-owner-quick-actions">
          <h2 id="media-owner-quick-actions" className="sr-only">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/upload"
              className={`${landing.card} flex min-h-[120px] flex-col justify-center border-emerald-200/50 bg-white/90 text-center dark:border-emerald-900/30`}
            >
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {t("quick_upload")}
              </span>
            </Link>
            <Link
              href="/dashboard/media-owner/medias"
              className={`${landing.card} flex min-h-[120px] flex-col justify-center border-sky-200/50 bg-white/90 text-center dark:border-sky-900/30`}
            >
              <span className="text-sm font-semibold text-blue-700 dark:text-sky-300">
                {t("quick_medias")}
              </span>
            </Link>
            <Link
              href="/dashboard/media-owner/inquiries"
              className={`${landing.card} flex min-h-[120px] flex-col justify-center bg-white/90 text-center`}
            >
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {t("quick_inquiries")}
              </span>
            </Link>
          </div>
        </section>

        <section aria-labelledby="media-owner-stats">
          <h2 id="media-owner-stats" className="sr-only">
            Stats
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`${landing.card} flex flex-col justify-between border-zinc-200/80 bg-white/95 dark:border-zinc-700`}
              >
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {s.label}
                </span>
                <span className="mt-2 text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {s.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          className={`${landing.surface} border-emerald-100/80 dark:border-zinc-700`}
          aria-labelledby="map-preview"
        >
          <h2
            id="map-preview"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {t("map_title")}
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {t("map_caption")}
          </p>
          <div className="mt-4">
            <MediaOwnerMapPreview />
          </div>
        </section>
      </main>
    </DashboardChrome>
  );
}
