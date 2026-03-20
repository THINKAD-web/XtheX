"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocalDaypart } from "@/hooks/use-local-daypart";
import { landing } from "@/lib/landing-theme";

export function HomeSolidDaypartWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const part = useLocalDaypart();
  const isDay = part === "day";

  return (
    <section
      className={cn(
        "relative border-t py-20 transition-colors duration-500 lg:py-28",
        isDay
          ? "border-zinc-200 bg-gradient-to-b from-zinc-100 via-zinc-50 to-white"
          : "border-zinc-800/50 bg-zinc-950",
      )}
    >
      <div
        className={cn(
          isDay && "home-solid-day",
          `${landing.container} ${landing.sectionStack}`,
        )}
      >
        {children}
      </div>
    </section>
  );
}
