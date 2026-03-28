import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { gateAdvertiserDashboard } from "@/lib/auth/dashboard-gate";
import { AutoBiddingClient } from "@/components/dashboard/AutoBiddingClient";

export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.autoBidding");
  return {
    title: `${t("title")} | XtheX`,
    description: t("subtitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AutoBiddingPage() {
  await gateAdvertiserDashboard();
  const t = await getTranslations("dashboard.autoBidding");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AutoBiddingClient />
    </div>
  );
}
