import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DashboardSessionSpinner } from "@/components/dashboard/DashboardSessionSpinner";

/**
 * 대시보드 공통: 고정 SiteHeader + 본문 영역 (pt-14).
 */
export function DashboardChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/80 via-background to-emerald-50/40 text-foreground dark:from-zinc-950 dark:via-zinc-950 dark:to-emerald-950/25">
      <SiteHeader />
      <DashboardSessionSpinner />
      <div className="pt-14">{children}</div>
    </div>
  );
}
