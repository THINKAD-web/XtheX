"use client";

import { useRef } from "react";
import { Shield, Globe, Zap, Lock } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { landing } from "@/lib/landing-theme";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

const ICONS = [Shield, Globe, Zap, Lock] as const;

type Card = { title: string; desc: string };

type Props = {
  sectionTitle: string;
  sectionSubtitle: string;
  startCta: string;
  cards: [Card, Card, Card, Card];
};

export function FeaturesSectionClient({
  sectionTitle,
  sectionSubtitle,
  startCta,
  cards,
}: Props) {
  const isLight = useLandingLightChrome();
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, amount: 0.15 });

  return (
    <section
      className={cn(
        landing.sectionAlt,
        "relative border-t py-20 lg:py-28",
        isLight
          ? "border-zinc-200 bg-gradient-to-b from-zinc-50 to-white"
          : "border-zinc-800/50 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900/40",
      )}
    >
      <div className={landing.container}>
        <h2
          className={cn(
            "text-center text-3xl font-bold tracking-tight lg:text-4xl",
            isLight ? "text-zinc-900 dark:text-zinc-900" : landing.h2,
          )}
        >
          {sectionTitle}
        </h2>
        <p
          className={cn(
            landing.lead,
            isLight && "text-zinc-600 dark:text-zinc-600",
          )}
        >
          {sectionSubtitle}
        </p>
        <div ref={gridRef} className={landing.grid4}>
          {cards.map((card, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                animate={gridInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                className={cn(
                  landing.card,
                  isLight &&
                    "border-zinc-200 bg-white shadow-lg shadow-zinc-200/30 dark:border-zinc-200 dark:bg-white",
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    isLight
                      ? "bg-blue-100 text-blue-600"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3
                  className={cn(
                    "mt-5 text-lg font-semibold",
                    isLight
                      ? "text-zinc-900 dark:text-zinc-900"
                      : "text-zinc-900 dark:text-zinc-50",
                  )}
                >
                  {card.title}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-pretty text-sm leading-relaxed lg:text-base",
                    isLight
                      ? "text-zinc-600 dark:text-zinc-600"
                      : "text-zinc-600 dark:text-zinc-400",
                  )}
                >
                  {card.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-14 flex justify-center">
          <Link href="/explore" className={landing.btnPrimaryMuted}>
            {startCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
