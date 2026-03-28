import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { gateAdminDashboard } from "@/lib/auth/dashboard-gate";
import { UserAnalyticsDashboard } from "@/components/admin/UserAnalyticsDashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.userAnalytics");
  return { title: t("title") };
}

export default async function AdminUserAnalyticsPage() {
  await gateAdminDashboard();
  const t = await getTranslations("admin.userAnalytics");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        {t("title")}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
        {t("subtitle")}
      </p>
      <UserAnalyticsDashboard />
    </div>
  );
}
