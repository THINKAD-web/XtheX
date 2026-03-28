"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useBrightness, type BrightnessPref } from "@/components/brightness/BrightnessPreference";
import { cn } from "@/lib/utils";

const META: Record<BrightnessPref, { Icon: typeof Sun; label: string }> = {
  auto: { Icon: Monitor, label: "Theme: auto — click for light" },
  bright: { Icon: Sun, label: "Theme: light — click for dark" },
  dim: { Icon: Moon, label: "Theme: dark — click for auto" },
};

export function ThemeToggle() {
  const { pref, cycle } = useBrightness();
  const { Icon, label } = META[pref];

  return (
    <button
      type="button"
      onClick={cycle}
      title={label}
      aria-label={label}
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        "border border-border bg-background text-muted-foreground shadow-sm",
        "transition-all duration-300 ease-in-out",
        "hover:bg-muted/80 hover:text-foreground hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <span className="relative h-4 w-4">
        <Sun
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300",
            pref === "bright"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0",
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300",
            pref === "dim"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0",
          )}
        />
        <Monitor
          className={cn(
            "absolute inset-0 h-4 w-4 transition-all duration-300",
            pref === "auto"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0",
          )}
        />
      </span>
    </button>
  );
}
