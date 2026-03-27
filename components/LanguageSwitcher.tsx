"use client";

import { useLocale } from "next-intl";
import { Monitor, Moon, Sun, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useBrightness } from "@/components/brightness/BrightnessPreference";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SUPPORTED_LOCALES = ["ko", "en", "ja", "zh"] as const;

const LABELS: Record<(typeof SUPPORTED_LOCALES)[number], string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale() as (typeof SUPPORTED_LOCALES)[number];

  const handleChange = (nextLocale: string) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale as any)) return;
    if (nextLocale === activeLocale) return;
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${pathname}${search}`, { locale: nextLocale });
    router.refresh();
  };

  return (
    <div
      className="inline-flex h-9 items-stretch overflow-hidden rounded-md border border-border bg-background shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
      role="group"
      aria-label="Language switcher"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-7 items-center gap-1 self-center px-2 text-[10px] font-semibold tracking-wide text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none"
          >
            {activeLocale.toUpperCase()}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="min-w-[120px]">
          {SUPPORTED_LOCALES.map((code) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleChange(code)}
              className={cn(
                "flex items-center gap-2 text-xs",
                activeLocale === code && "font-bold",
              )}
            >
              <span className="w-6 font-semibold">{code.toUpperCase()}</span>
              <span className="text-muted-foreground">{LABELS[code]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <BrightnessToggle />
    </div>
  );
}

function BrightnessToggle() {
  const { pref, cycle } = useBrightness();
  const Icon = pref === "auto" ? Monitor : pref === "bright" ? Sun : Moon;
  const title =
    pref === "auto"
      ? "밝기: 자동 (시간대) — 클릭 시 밝게"
      : pref === "bright"
        ? "밝기: 밝게 — 클릭 시 어둡게"
        : "밝기: 어둡게 — 클릭 시 자동";

  return (
    <button
      type="button"
      onClick={cycle}
      title={title}
      aria-label={title}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center border-l border-border bg-transparent p-0 text-muted-foreground transition-colors",
        "hover:bg-muted/80 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
    </button>
  );
}
