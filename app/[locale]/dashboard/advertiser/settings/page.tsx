import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Settings } from "lucide-react";
import { PushNotificationButton } from "@/components/pwa/PushNotificationButton";

export const metadata: Metadata = {
  title: "Settings | XtheX",
  robots: { index: false, follow: false },
};

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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
          {isKo ? "알림 설정" : "Notification Settings"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isKo
            ? "푸시 알림을 활성화하면 새로운 문의, 캠페인 상태 변경, 추천 매체 등을 실시간으로 받을 수 있습니다."
            : "Enable push notifications to receive real-time updates about new inquiries, campaign status changes, and recommended media."}
        </p>
        <PushNotificationButton />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          {isKo ? "앱 설치" : "Install App"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isKo
            ? "XtheX를 홈 화면에 추가하면 앱처럼 빠르게 접근할 수 있습니다. 브라우저 주소 표시줄의 설치 아이콘을 눌러주세요."
            : "Add XtheX to your home screen for quick app-like access. Look for the install icon in your browser's address bar."}
        </p>
      </section>
    </div>
  );
}
