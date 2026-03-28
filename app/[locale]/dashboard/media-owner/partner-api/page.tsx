import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { PartnerApiDashboardClient } from "@/components/dashboard/PartnerApiDashboardClient";

export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.partnerApi");
  return {
    title: `${t("title")} | XtheX`,
    description: t("subtitle"),
    robots: { index: false, follow: false },
  };
}

export default async function PartnerApiPage() {
  await gateMediaOwnerDashboard();
  const t = await getTranslations("dashboard.partnerApi");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <PartnerApiDashboardClient />
    </div>
  );
}
