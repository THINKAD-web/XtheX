"use client";

import { landing } from "@/lib/landing-theme";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

const PARTNERS = [
  "Clear Channel Outdoor",
  "JCDecaux",
  "Lamar Advertising",
  "Outfront Media",
  "oOh!media",
  "Talon Outdoor",
  "Ocean Outdoor",
  "DOOH.com",
  "Vistar Media",
  "Broadsign",
];

type Props = {
  title: string;
  subtitle: string;
};

function PartnerBadge({ name }: { name: string }) {
  return (
    <span className="inline-block shrink-0 whitespace-nowrap rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
      {name}
    </span>
  );
}

export function PartnersSectionClient({ title, subtitle }: Props) {
  const isDay = useLandingLightChrome();

  const doubled = [...PARTNERS, ...PARTNERS];

  return (
    <section
      className={cn(
        landing.sectionAlt,
        "relative border-t py-20 lg:py-28 overflow-hidden",
        isDay
          ? "border-zinc-200 bg-gradient-to-b from-white to-zinc-50"
          : "border-zinc-800/50 bg-white/90 dark:bg-zinc-950/90",
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
      </div>

      <div className="relative mt-12 lg:mt-16">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white dark:from-zinc-950" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white dark:from-zinc-950" />

        <div className="flex w-max animate-marquee gap-4">
          {doubled.map((name, i) => (
            <PartnerBadge key={`${name}-${i}`} name={name} />
          ))}
        </div>
      </div>
    </section>
  );
}
