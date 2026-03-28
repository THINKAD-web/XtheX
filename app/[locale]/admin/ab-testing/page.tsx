import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { gateAdminDashboard } from "@/lib/auth/dashboard-gate";
import { AbTestingAdminClient } from "@/components/admin/AbTestingAdminClient";

export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.abTesting");
  return {
    title: `${t("title")} | XtheX`,
    description: t("subtitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AdminAbTestingPage() {
  await gateAdminDashboard();
  const t = await getTranslations("admin.abTesting");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AbTestingAdminClient />
    </div>
  );
}
