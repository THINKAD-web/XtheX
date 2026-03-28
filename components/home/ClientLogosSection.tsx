"use client";

import { landing } from "@/lib/landing-theme";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

const CLIENT_LOGOS = [
  { name: "Samsung", color: "text-blue-600" },
  { name: "Hyundai", color: "text-sky-600" },
  { name: "LG", color: "text-red-600" },
  { name: "Nike", color: "text-zinc-900 dark:text-zinc-100" },
  { name: "Coca-Cola", color: "text-red-500" },
  { name: "Google", color: "text-emerald-600" },
  { name: "Apple", color: "text-zinc-800 dark:text-zinc-200" },
  { name: "Amazon", color: "text-amber-600" },
  { name: "Netflix", color: "text-red-600" },
  { name: "Sony", color: "text-zinc-900 dark:text-zinc-100" },
  { name: "Toyota", color: "text-red-700" },
  { name: "Unilever", color: "text-blue-700" },
];

type Props = {
  title?: string;
  subtitle?: string;
};

export function ClientLogosSection({
  title = "Trusted by Leading Brands",
  subtitle = "세계 유수의 브랜드가 XtheX를 통해 옥외광고를 집행합니다",
}: Props) {
  const isDay = useLandingLightChrome();
  const doubled = [...CLIENT_LOGOS, ...CLIENT_LOGOS];

  return (
    <section
      className={cn(
        "relative overflow-hidden border-t py-14 lg:py-20",
        isDay
          ? "border-zinc-200 bg-white"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950",
      )}
    >
      <div className={cn(landing.container, "text-center")}>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {title}
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>

      <div className="relative mt-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white dark:from-zinc-950" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white dark:from-zinc-950" />

        <div className="flex w-max animate-marquee gap-8">
          {doubled.map((logo, i) => (
            <div
              key={`${logo.name}-${i}`}
              className="flex h-12 w-28 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 dark:border-zinc-700 dark:bg-zinc-800/50"
            >
              <span
                className={cn(
                  "text-sm font-bold tracking-tight",
                  logo.color,
                )}
              >
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
