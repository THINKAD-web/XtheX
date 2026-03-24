"use client";

import { Star } from "lucide-react";
import { landing } from "@/lib/landing-theme";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
};

type Props = {
  title: string;
  subtitle: string;
  items: TestimonialItem[];
};

export function TestimonialsSectionClient({
  title,
  subtitle,
  items,
}: Props) {
  const isDay = useLandingLightChrome();

  return (
    <section
      className={cn(
        landing.sectionAlt,
        "relative border-t py-20 lg:py-28",
        isDay
          ? "border-zinc-200 bg-gradient-to-b from-zinc-50 to-white"
          : "border-zinc-800/50 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900/50",
      )}
    >
      <div className={landing.container}>
        <h2
          className={cn(
            "text-center text-3xl font-bold tracking-tight lg:text-4xl",
            isDay ? "text-zinc-900 dark:text-zinc-900" : "text-zinc-900 dark:text-zinc-50",
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            landing.lead,
            isDay && "text-zinc-600 dark:text-zinc-600",
          )}
        >
          {subtitle}
        </p>
        <div className={landing.grid3}>
          {items.map((row) => (
            <div
              key={row.quote}
              className={cn(
                landing.card,
                isDay &&
                  "border-zinc-200 bg-white shadow-lg shadow-zinc-200/30 dark:border-zinc-200 dark:bg-white",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-1",
                  isDay ? "text-blue-600" : "text-blue-400 dark:text-blue-400",
                )}
              >
                {Array.from({ length: row.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p
                className={cn(
                  "text-pretty text-base leading-relaxed lg:text-lg",
                  isDay ? "text-zinc-600" : "text-zinc-600 dark:text-zinc-400",
                )}
              >
                &ldquo;{row.quote}&rdquo;
              </p>
              <div
                className={cn(
                  "mt-auto flex items-center gap-3 border-t pt-4",
                  isDay ? "border-zinc-200" : "border-zinc-200/80 dark:border-zinc-700/60",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    isDay
                      ? "bg-blue-100 text-blue-700"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
                  )}
                >
                  {row.avatar}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-semibold",
                      isDay ? "text-zinc-900" : "text-zinc-900 dark:text-zinc-50",
                    )}
                  >
                    {row.name}
                    {row.role ? ` ${row.role}` : ""}
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      isDay ? "text-zinc-500" : "text-zinc-500 dark:text-zinc-400",
                    )}
                  >
                    {row.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
