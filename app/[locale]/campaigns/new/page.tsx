import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewCampaignPlaceholderPage() {
  await gateAdvertiserDashboard();
  const t = await getTranslations("dashboard.advertiser");

  return (
    <DashboardChrome>
      <div className={`${landing.container} max-w-2xl space-y-8 py-12 lg:py-16`}>
        <div
          className={`${landing.surface} border-sky-200/60 p-8 dark:border-zinc-700`}
        >
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("placeholders.new_title")}
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("placeholders.new_body")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/explore" className={landing.btnPrimary}>
              {t("placeholders.cta_explore")}
            </Link>
            <Link href="/dashboard/advertiser" className={landing.btnSecondary}>
              {t("placeholders.back_dashboard")}
            </Link>
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
