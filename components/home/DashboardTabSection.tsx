"use client";

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  locale: string;
  realtimeSlot: ReactNode;
  performanceSlot: ReactNode;
};

export function DashboardTabSection({ locale, realtimeSlot, performanceSlot }: Props) {
  const [tab, setTab] = useState<"realtime" | "performance">("realtime");
  return (
    <div>
      <div className="flex justify-center gap-2 py-4">
        <button
          type="button"
          onClick={() => setTab("realtime")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "realtime"
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
          )}
        >
          {locale.startsWith("ko") ? "실시간 현황" : locale.startsWith("ja") ? "リアルタイム" : locale.startsWith("zh") ? "实时数据" : "Realtime"}
        </button>
        <button
          type="button"
          onClick={() => setTab("performance")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "performance"
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400",
          )}
        >
          {locale.startsWith("ko") ? "성과 대시보드" : locale.startsWith("ja") ? "パフォーマンス" : locale.startsWith("zh") ? "效果数据" : "Performance"}
        </button>
      </div>
      <div className={tab === "realtime" ? undefined : "hidden"}>{realtimeSlot}</div>
      <div className={tab === "performance" ? undefined : "hidden"}>{performanceSlot}</div>
    </div>
  );
}
