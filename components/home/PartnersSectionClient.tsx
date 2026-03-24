"use client";

import Image from "next/image";
import { landing } from "@/lib/landing-theme";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

const PARTNERS: { name: string; slug: string; logo: string }[] = [
  { name: "JCDecaux", slug: "jcdecaux", logo: "/logos/jcdecaux.svg" },
  { name: "Clear Channel", slug: "clear-channel", logo: "/logos/clear-channel.svg" },
  { name: "Lamar", slug: "lamar", logo: "/logos/lamar.svg" },
  { name: "OUTFRONT", slug: "outfront", logo: "/logos/outfront.svg" },
  { name: "Stroer", slug: "stroer", logo: "/logos/stroer.svg" },
  { name: "Global", slug: "global", logo: "/logos/global.svg" },
  { name: "Primesight", slug: "primesight", logo: "/logos/primesight.svg" },
  { name: "Ocean Outdoor", slug: "ocean-outdoor", logo: "/logos/ocean-outdoor.svg" },
];

type Props = {
  title: string;
  subtitle: string;
};

export function PartnersSectionClient({ title, subtitle }: Props) {
  const isDay = useLandingLightChrome();

  return (
    <section
      className={cn(
        landing.sectionAlt,
        "relative border-t py-20 lg:py-28",
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
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:mt-16 lg:grid-cols-6 lg:gap-6">
          {PARTNERS.map(({ name, logo }, index) => (
            <div
              key={name}
              className={cn(
                "flex min-h-[104px] items-center justify-center rounded-2xl border px-4 py-8 opacity-90 transition-all hover:opacity-100",
                isDay
                  ? "border-zinc-200 bg-white shadow-md shadow-zinc-200/40"
                  : landing.cardDarkCompact,
              )}
            >
              <Image
                src={logo}
                alt={name}
                width={140}
                height={52}
                className={cn(
                  "max-h-12 w-auto object-contain transition-opacity hover:opacity-100",
                  isDay
                    ? "opacity-90 hover:opacity-100"
                    : "opacity-90 dark:opacity-80 dark:hover:opacity-100",
                )}
                priority={index < 4}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
