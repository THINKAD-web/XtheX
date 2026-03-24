import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { landing } from "@/lib/landing-theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaOwnerInquiriesPage() {
  await gateMediaOwnerDashboard();
  const t = await getTranslations("dashboard.mediaOwner");

  return (
    <DashboardChrome>
      <div className={`${landing.container} max-w-2xl space-y-6 py-10 lg:py-14`}>
        <Link
          href="/dashboard/media-owner"
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← {t("back_dashboard")}
        </Link>
        <div
          className={`${landing.surface} border-sky-100/80 p-8 dark:border-zinc-700`}
        >
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {t("inquiries_title")}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {t("inquiries_subtitle")}
          </p>
          <p className="mt-6 rounded-xl border border-dashed border-emerald-300/50 bg-emerald-50/40 px-4 py-6 text-sm text-zinc-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-zinc-300">
            {t("inquiries_placeholder")}
          </p>
        </div>
      </div>
    </DashboardChrome>
  );
}
