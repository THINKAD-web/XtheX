"use client";

import * as React from "react";
import { useLocalDaypart } from "@/hooks/use-local-daypart";
import { cn } from "@/lib/utils";

export function AdminAiUploadGatePage({ message }: { message: string }) {
  const isDay = useLocalDaypart() === "day";
  return (
    <div
      className={cn(
        "min-h-screen p-6 transition-colors duration-500",
        isDay ? "bg-zinc-50" : "bg-black",
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-5xl rounded-xl p-6",
          isDay
            ? "border border-zinc-200 bg-white text-zinc-700 shadow-sm"
            : "border border-zinc-800 bg-zinc-950 text-zinc-400",
        )}
      >
        <p>{message}</p>
      </div>
    </div>
  );
}
