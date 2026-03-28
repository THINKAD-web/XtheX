"use client";

import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOfflineStatus } from "./offline-context";

export function OfflineBadge({ className }: { className?: string }) {
  const { isOnline } = useOfflineStatus();
  const t = useTranslations("offline");

  if (isOnline) return null;

  return (
    <span
      className={cn(
        "inline-flex max-w-[140px] items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100 sm:max-w-none sm:text-xs sm:normal-case",
        className,
      )}
      role="status"
      aria-live="polite"
      title={t("badge_aria")}
    >
      <WifiOff className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden />
      <span className="truncate">{t("badge_offline")}</span>
    </span>
  );
}
