"use client";

import * as React from "react";
import { Activity, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileHorizontalSwipe } from "./MobileHorizontalSwipe";

export type CampaignStatusKpisProps = {
  swipeHint?: string;
  activeCount: number;
  completedCount: number;
  pendingCount: number;
  labelActive: string;
  labelCompleted: string;
  labelPending: string;
  carouselAriaLabel: string;
};

export function CampaignStatusKpis({
  swipeHint,
  activeCount,
  completedCount,
  pendingCount,
  labelActive,
  labelCompleted,
  labelPending,
  carouselAriaLabel,
}: CampaignStatusKpisProps) {
  const cards = [
    {
      icon: Activity,
      label: labelActive,
      value: activeCount,
      iconWrap: "bg-blue-100 dark:bg-blue-900/40",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: CheckCircle,
      label: labelCompleted,
      value: completedCount,
      iconWrap: "bg-emerald-100 dark:bg-emerald-900/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      icon: Clock,
      label: labelPending,
      value: pendingCount,
      iconWrap: "bg-amber-100 dark:bg-amber-900/40",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
  ] as const;

  const renderCard = (c: (typeof cards)[number]) => {
    const Icon = c.icon;
    return (
      <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            c.iconWrap,
          )}
        >
          <Icon className={cn("h-5 w-5", c.iconColor)} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{c.label}</p>
          <p className="text-2xl font-bold tabular-nums">{c.value}</p>
        </div>
      </div>
    );
  };

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="hidden sm:contents">
        {cards.map((c) => (
          <React.Fragment key={c.label}>{renderCard(c)}</React.Fragment>
        ))}
      </div>
      <div className="sm:hidden">
        <MobileHorizontalSwipe
          ariaLabel={carouselAriaLabel}
          hint={swipeHint}
          slideBasis="92%"
        >
          {cards.map((c) => (
            <div key={c.label}>{renderCard(c)}</div>
          ))}
        </MobileHorizontalSwipe>
      </div>
    </section>
  );
}
