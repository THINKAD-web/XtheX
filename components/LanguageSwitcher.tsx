"use client";

import { useLocale } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useBrightness } from "@/components/brightness/BrightnessPreference";
import { cn } from "@/lib/utils";

const SUPPORTED_LOCALES = ["ko", "en", "ja", "zh"] as const;

const LABELS: Record<(typeof SUPPORTED_LOCALES)[number], string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "中文",
};

const FLAGS: Record<(typeof SUPPORTED_LOCALES)[number], string> = {
  ko: "🇰🇷",
  en: "🇺🇸",
  ja: "🇯🇵",
  zh: "🇨🇳",
};

const segmentInner =
  "flex h-9 min-h-9 items-center text-xs text-foreground transition-colors";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale() as (typeof SUPPORTED_LOCALES)[number];

  const handleChange = (nextLocale: string) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale as (typeof SUPPORTED_LOCALES)[number])) return;
    if (nextLocale === activeLocale) return;

    const search =
      typeof window !== "undefined" && window.location.search
        ? window.location.search
        : "";

    router.replace(`${pathname}${search}`, { locale: nextLocale });
    router.refresh();
  };

  return (
    <div
      className={cn(
        "inline-flex h-9 min-h-9 items-stretch overflow-hidden rounded-md border border-border bg-background shadow-sm",
        "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
      )}
      role="group"
      aria-label="Language and brightness"
    >
      <label className={cn(segmentInner, "cursor-pointer gap-1.5 border-r border-border px-2.5 hover:bg-muted/60")}>
        <span className="shrink-0 text-[13px] leading-none text-muted-foreground" aria-hidden>
          🌐
        </span>
        <select
          aria-label="Select language"
          className={cn(
            "h-full min-w-0 max-w-[9.5rem] cursor-pointer bg-transparent py-0 pr-1 text-xs text-foreground outline-none",
            "focus-visible:ring-0 sm:max-w-none",
          )}
          value={activeLocale}
          onChange={(e) => handleChange(e.target.value)}
        >
          {SUPPORTED_LOCALES.map((code) => (
            <option key={code} value={code}>
              {FLAGS[code]} {LABELS[code]}
            </option>
          ))}
        </select>
      </label>
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
        segmentInner,
        "w-9 shrink-0 justify-center border-0 bg-transparent p-0 text-muted-foreground",
        "hover:bg-muted/80 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
    </button>
  );
}
