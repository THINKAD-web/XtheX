import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { RecommendationsExperience } from "@/components/recommend/RecommendationsExperience";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { getLocalizedPath } from "@/lib/auth/paths";
import { landing } from "@/lib/landing-theme";
import { UserRole } from "@prisma/client";
import { getAdvertiserRecommendations } from "@/lib/recommend/get-advertiser-recommendations";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.advertiser.recommendationsV2");
  return {
    title: `${t("page_title")} | XtheX`,
    description: t("page_subtitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdvertiserRecommendationsPage() {
  const user = await gateAdvertiserDashboard();
  if (user.role !== UserRole.ADVERTISER) {
    redirect(await getLocalizedPath("/dashboard/advertiser"));
  }
  const recommendations = await getAdvertiserRecommendations();
  const locale = await getLocale();
  const t = await getTranslations("dashboard.advertiser.recommendationsV2");

  return (
    <main className={`${landing.container} space-y-8 py-10 lg:py-14`}>
      <div>
        <Link
          href="/dashboard/advertiser"
          className="text-sm font-medium text-blue-600 hover:underline dark:text-sky-400"
        >
          ← {t("back_dashboard")}
        </Link>
        <section className="relative mt-4 overflow-hidden rounded-3xl border border-sky-200/60 bg-gradient-to-br from-white via-sky-50/40 to-blue-50/20 p-6 shadow-lg dark:border-zinc-700 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-sky-950/20 dark:shadow-black/30 lg:p-8">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {t("page_title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("page_subtitle")}
          </p>
        </section>
      </div>

      <RecommendationsExperience initialItems={recommendations} locale={locale} />
    </main>
  );
}
