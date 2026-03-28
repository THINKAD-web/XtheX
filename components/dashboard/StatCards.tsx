"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { MobileHorizontalSwipe } from "./MobileHorizontalSwipe";

export type StatCard = {
  label: string;
  value: string;
  hint?: string;
  tone?: "blue" | "emerald" | "zinc";
};

type Props = {
  title?: string;
  cards: StatCard[];
  loading?: boolean;
  className?: string;
  /** 모바일 스와이프 영역 안내 문구 */
  swipeHint?: string;
  /** 모바일 캐러셀 접근성 라벨 */
  swipeAriaLabel?: string;
};

function toneClass(tone: StatCard["tone"]) {
  if (tone === "emerald")
    return "border-emerald-200/60 from-emerald-50/60 to-white dark:border-emerald-900/30 dark:from-emerald-950/25 dark:to-zinc-900/30";
  if (tone === "blue")
    return "border-sky-200/60 from-sky-50/60 to-white dark:border-sky-900/30 dark:from-sky-950/25 dark:to-zinc-900/30";
  return "border-zinc-200/70 from-white to-white dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-950";
}

function StatCardCell({ c }: { c: StatCard }) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-5 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
        toneClass(c.tone ?? "zinc"),
      )}
    >
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {c.label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
        {c.value}
      </p>
      {c.hint ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{c.hint}</p>
      ) : null}
    </div>
  );
}

export function StatCards({
  title,
  cards,
  loading,
  className,
  swipeHint,
  swipeAriaLabel,
}: Props) {
  if (loading) {
    return (
      <div className={className}>
        <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[108px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/60"
            />
          ))}
        </div>
        <div className="space-y-3 sm:hidden">
          <div className="h-[108px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/60" />
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const ariaCarousel =
    swipeAriaLabel ?? title ?? "Key metrics";

  return (
    <section className={className} aria-label={title ?? "Stats"}>
      {title ? (
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {title}
        </h2>
      ) : null}
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCardCell key={c.label} c={c} />
        ))}
      </div>
      <div className="sm:hidden">
        <MobileHorizontalSwipe
          ariaLabel={ariaCarousel}
          hint={swipeHint}
          slideBasis="90%"
        >
          {cards.map((c) => (
            <StatCardCell key={c.label} c={c} />
          ))}
        </MobileHorizontalSwipe>
      </div>
    </section>
  );
}

