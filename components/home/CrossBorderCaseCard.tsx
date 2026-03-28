"use client";
import { memo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  tag: string;
  title: string;
  description: string;
  fromCountry: string;
  toCountry: string;
  className?: string;
};

export const CrossBorderCaseCard = memo(function CrossBorderCaseCard({ tag, title, description, fromCountry, toCountry, className }: Props) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm dark:border-blue-800/40 dark:from-blue-950/40 dark:to-zinc-900 hover:scale-[1.02] hover:shadow-blue-200/60 hover:border-blue-300/60 transition-all duration-300 cursor-pointer",
      className
    )}>
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
          {tag}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {fromCountry} → {toCountry}
        </span>
      </div>
      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
});
