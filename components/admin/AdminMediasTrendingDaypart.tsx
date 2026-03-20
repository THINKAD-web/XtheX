"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useLocalDaypart } from "@/hooks/use-local-daypart";

export function AdminMediasTrendingDaypart({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDay = useLocalDaypart() === "day";
  return (
    <div className={cn(isDay && "admin-medias-trending-day")}>{children}</div>
  );
}
