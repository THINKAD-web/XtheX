"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle, FileText, Globe, Users } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { CountUp } from "@/components/count-up";
import { landing } from "@/lib/landing-theme";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

const DEFAULT_ITEMS: Array<{
  end: number;
  suffix: string;
  duration: number;
  icon: LucideIcon;
  label: string;
}> = [
  {
    end: 16,
    suffix: "+",
    duration: 2,
    icon: Users,
    label: "등록 매체",
  },
  {
    end: 95,
    suffix: "%",
    duration: 2,
    icon: CheckCircle,
    label: "AI 검토 정확도",
  },
  {
    end: 4,
    suffix: "+",
    duration: 1.5,
    icon: Globe,
    label: "국가 커버리지",
  },
  {
    end: 4,
    suffix: "개 언어",
    duration: 1.5,
    icon: FileText,
    label: "다국어 지원",
  },
];

export type StatsSectionItem = {
  end: number;
  suffix: string;
  duration?: number;
  label: string;
};

type StatsSectionProps = {
  title?: string;
  subtitle?: string;
  firstStatEnd?: number;
  variant?: "default" | "calm";
  items?: StatsSectionItem[];
  ease?: "easeOut" | "easeInOut" | [number, number, number, number];
};

export function StatsSection({
  title = "XtheX by the Numbers",
  subtitle = "XtheX의 신뢰 지표",
  firstStatEnd = 1000,
  variant = "default",
  items: customItems,
  ease,
}: StatsSectionProps) {
  const isLight = useLandingLightChrome();

  const items = customItems
    ? customItems.map((item, i) => ({
        ...DEFAULT_ITEMS[i],
        ...item,
        duration: item.duration ?? 2,
      }))
    : DEFAULT_ITEMS.map((item, i) =>
        i === 0 ? { ...item, end: firstStatEnd } : item
      );

  const sectionClass =
    variant === "calm"
      ? cn(
          landing.section,
          "relative border-t py-20 lg:py-28",
          isLight
            ? "border-zinc-200 bg-white"
            : "border-zinc-800/50 bg-white dark:bg-zinc-950",
        )
      : cn(
          landing.sectionAlt,
          "relative border-t py-20 lg:py-28",
          isLight
            ? "border-zinc-200 bg-gradient-to-b from-white to-zinc-50"
            : "border-zinc-800/50 bg-gradient-to-b from-white to-zinc-50/90 dark:from-zinc-950 dark:to-zinc-900/50",
        );

  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, amount: 0.15 });

  return (
    <section className={sectionClass}>
      <div className={landing.container}>
        <h2
          className={cn(
            "text-center text-3xl font-bold tracking-tight lg:text-4xl",
            isLight ? "text-zinc-900 dark:text-zinc-900" : landing.h2,
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            landing.lead,
            isLight && "text-zinc-600 dark:text-zinc-600",
          )}
        >
          {subtitle}
        </p>
        <div ref={gridRef} className={landing.grid4}>
          {items.map(({ end, suffix, duration, icon: Icon, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={gridInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className={cn(
                `${landing.card} flex flex-col items-center gap-4 px-6 py-10 text-center`,
                isLight &&
                  "border-zinc-200 bg-white shadow-lg shadow-zinc-200/30 dark:border-zinc-200 dark:bg-white",
              )}
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl",
                  isLight
                    ? "bg-blue-100 text-blue-600"
                    : "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
                )}
              >
                <Icon className="h-7 w-7" />
              </div>
              <span
                className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent text-3xl font-bold tabular-nums sm:text-4xl"
              >
                <CountUp
                  end={end}
                  duration={duration}
                  suffix={suffix}
                  startOnView
                  ease={ease}
                />
              </span>
              <p
                className={cn(
                  "text-pretty text-sm font-medium",
                  isLight
                    ? "text-zinc-600 dark:text-zinc-600"
                    : "text-zinc-600 dark:text-zinc-400",
                )}
              >
                {label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
