import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Settings } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { gateMediaOwnerDashboard } from "@/lib/auth/dashboard-gate";
import { PushNotificationButton } from "@/components/pwa/PushNotificationButton";
import { NotificationCategoryPrefs } from "@/components/notifications/NotificationCategoryPrefs";

export const metadata: Metadata = {
  title: "Settings | XtheX",
  robots: { index: false, follow: false },
};

export default async function MediaOwnerSettingsPage() {
  await gateMediaOwnerDashboard();
  const locale = await getLocale();
  const isKo = locale === "ko";

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">
          {isKo ? "설정" : "Settings"}
        </h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {isKo ? "알림 설정" : "Notification settings"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isKo
            ? "푸시와 인앱 알림 카테고리를 조정합니다."
            : "Manage push and in-app notification categories."}
        </p>
        <PushNotificationButton />
        <div className="pt-2">
          <NotificationCategoryPrefs />
        </div>
      </section>

      <Link
        href="/dashboard/media-owner"
        className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        ← {isKo ? "대시보드로" : "Back to dashboard"}
      </Link>
    </div>
  );
}
