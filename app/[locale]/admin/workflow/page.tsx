import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminWorkflowClient } from "@/components/admin/AdminWorkflowClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin workflow | XtheX",
  description: "Campaign pipeline, schedules, commercial tracking, CRM, todos, revenue.",
  robots: { index: false, follow: false },
};

export default async function AdminWorkflowPage() {
  const t = await getTranslations("admin.workflow");
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <AdminWorkflowClient />
    </div>
  );
}
