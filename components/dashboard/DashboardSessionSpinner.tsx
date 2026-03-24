"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

/** SessionProvider 재조회 시 우하단 최소 피드백 (전체 화면 가림 없음). */
export function DashboardSessionSpinner() {
  const { status } = useSession();
  const t = useTranslations("dashboard.common");

  if (status !== "loading") return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-sky-200/80 bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur-sm dark:border-zinc-600"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-emerald-400 dark:border-t-transparent"
        aria-hidden
      />
      {t("session_checking")}
    </div>
  );
}
