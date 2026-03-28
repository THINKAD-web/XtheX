"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Globe, Building2, Handshake, BarChart3 } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { landing } from "@/lib/landing-theme";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

const BADGES = [
  {
    icon: Building2,
    end: 500,
    suffix: "+",
    label: "등록 매체",
    labelEn: "Registered Media",
    gradient: "from-orange-500 to-amber-500",
    iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400",
  },
  {
    icon: Globe,
    end: 100,
    suffix: "+",
    label: "국가 커버리지",
    labelEn: "Countries Covered",
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
  },
  {
    icon: Handshake,
    end: 50,
    suffix: "+",
    label: "글로벌 파트너",
    labelEn: "Global Partners",
    gradient: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  {
    icon: BarChart3,
    end: 95,
    suffix: "%",
    label: "AI 매칭 정확도",
    labelEn: "AI Matching Accuracy",
    gradient: "from-violet-500 to-purple-500",
    iconBg: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  },
];

export function TrustBadgesSection() {
  const isLight = useLandingLightChrome();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      className={cn(
        "relative border-t py-16 lg:py-24",
        isLight
          ? "border-zinc-200 bg-gradient-to-b from-zinc-50 to-white"
          : "border-zinc-200 bg-gradient-to-b from-zinc-50 to-white dark:border-zinc-800 dark:from-zinc-900/50 dark:to-zinc-950",
      )}
    >
      <div className={landing.container}>
        <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map(({ icon: Icon, end, suffix, label, gradient, iconBg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border px-6 py-8 text-center",
                isLight
                  ? "border-zinc-200 bg-white shadow-sm"
                  : "border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50",
              )}
            >
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconBg)}>
                <Icon className="h-6 w-6" />
              </div>
              <span
                className={cn(
                  "bg-gradient-to-r bg-clip-text text-3xl font-extrabold tabular-nums text-transparent",
                  gradient,
                )}
              >
                <CountUp end={end} duration={2} suffix={suffix} startOnView />
              </span>
              <p
                className={cn(
                  "text-sm font-medium",
                  isLight ? "text-zinc-600" : "text-zinc-600 dark:text-zinc-400",
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
