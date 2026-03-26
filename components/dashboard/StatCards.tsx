"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type StatCard = {
  label: string;
  value: string;
  hint?: string;
  tone?: "blue" | "emerald" | "zinc";
};

type Props = {
  title?: string;
  cards: [StatCard, StatCard, StatCard, StatCard];
  loading?: boolean;
  className?: string;
};

function toneClass(tone: StatCard["tone"]) {
  if (tone === "emerald")
    return "border-emerald-200/60 from-emerald-50/60 to-white dark:border-emerald-900/30 dark:from-emerald-950/25 dark:to-zinc-900/30";
  if (tone === "blue")
    return "border-sky-200/60 from-sky-50/60 to-white dark:border-sky-900/30 dark:from-sky-950/25 dark:to-zinc-900/30";
  return "border-zinc-200/70 from-white to-white dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-950";
}

export function StatCards({ title, cards, loading, className }: Props) {
  if (loading) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className="h-[108px] animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100/80 dark:border-zinc-800 dark:bg-zinc-900/60"
          />
        ))}
      </div>
    );
  }

  return (
    <section className={className} aria-label={title ?? "Stats"}>
      {title ? (
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {title}
        </h2>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
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
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {c.hint}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

