"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocalDaypart } from "@/hooks/use-local-daypart";

export function AdminMediasDaypartShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDay = useLocalDaypart() === "day";
  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-500",
        isDay ? "bg-zinc-50" : "bg-zinc-950",
      )}
    >
      {children}
    </div>
  );
}
