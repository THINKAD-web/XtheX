"use client";

import * as React from "react";
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

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale() as (typeof SUPPORTED_LOCALES)[number];

  const handleChange = (nextLocale: string) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale as (typeof SUPPORTED_LOCALES)[number])) return;
    if (nextLocale === activeLocale) return;

    // Preserve current query string (e.g. compare ids) when switching locale
    const search =
      typeof window !== "undefined" && window.location.search
        ? window.location.search
        : "";

    router.replace(`${pathname}${search}`, { locale: nextLocale });
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex h-9 min-h-9 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-0 text-xs text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
        <span className="mr-1 text-[13px]" aria-hidden>
          🌐
        </span>
        <select
          aria-label="Select language"
          className="h-full min-w-0 bg-transparent text-xs outline-none"
          value={activeLocale}
          onChange={(e) => handleChange(e.target.value)}
        >
          {SUPPORTED_LOCALES.map((code) => (
            <option key={code} value={code}>
              {FLAGS[code]} {LABELS[code]}
            </option>
          ))}
        </select>
      </div>
      <BrightnessToggle />
    </div>
  );
}

function BrightnessToggle() {
  const { pref, cycle } = useBrightness();
  const Icon =
    pref === "auto" ? Monitor : pref === "bright" ? Sun : Moon;
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
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border shadow-sm transition-colors",
        "border-zinc-600 bg-zinc-700 text-amber-200 hover:bg-zinc-600 hover:text-amber-100",
        "dark:border-zinc-400 dark:bg-zinc-200 dark:text-amber-800 dark:hover:bg-zinc-100 dark:hover:text-amber-900",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

