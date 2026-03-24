import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RecommendExperience } from "@/components/recommend/RecommendExperience";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdvertiserRecommendPage() {
  await gateAdvertiserDashboard();
  const t = await getTranslations("dashboard.advertiser.recommend");

  return (
    <DashboardChrome>
      <main className={`${landing.container} space-y-10 py-10 lg:space-y-12 lg:py-14`}>
        <div>
          <Link
            href="/dashboard/advertiser"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-sky-400"
          >
            ← {t("back")}
          </Link>
          <section className="relative mt-6 overflow-hidden rounded-3xl border border-sky-200/60 bg-gradient-to-br from-white via-sky-50/40 to-emerald-50/30 p-8 shadow-lg dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-emerald-950/20 dark:shadow-black/30 lg:p-10">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-400/15 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl"
              aria-hidden
            />
            <h1 className="relative text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
              {t("page_title")}
            </h1>
            <p className="relative mt-4 max-w-3xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              {t("page_subtitle")}
            </p>
          </section>
        </div>

        <RecommendExperience />
      </main>
    </DashboardChrome>
  );
}
