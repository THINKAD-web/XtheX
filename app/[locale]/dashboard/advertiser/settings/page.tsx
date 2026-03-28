import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Settings, Shield } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PushNotificationButton } from "@/components/pwa/PushNotificationButton";
import { NotificationCategoryPrefs } from "@/components/notifications/NotificationCategoryPrefs";

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
          {isKo ? "보안 및 2단계 인증" : "Security & two-factor authentication"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isKo
            ? "OTP, 패스키, 이메일·SMS 채널, 로그인 기기를 관리합니다."
            : "Manage OTP, passkeys, email/SMS channels, and signed-in devices."}
        </p>
        <Link
          href="/dashboard/advertiser/settings/security"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
        >
          <Shield className="h-4 w-4 text-primary" aria-hidden />
          {isKo ? "보안 설정 열기" : "Open security settings"}
        </Link>
      </section>

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
        <div className="pt-2">
          <NotificationCategoryPrefs />
        </div>
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
