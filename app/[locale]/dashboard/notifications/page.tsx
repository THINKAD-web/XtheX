import { getTranslations } from "next-intl/server";
import { NotificationHistoryClient } from "@/components/notifications/NotificationHistoryClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NotificationHistoryPage() {
  const t = await getTranslations("notificationHistory");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>
      <NotificationHistoryClient />
    </div>
  );
}
