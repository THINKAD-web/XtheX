"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

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
    router.replace(pathname, { locale: nextLocale });
    router.refresh();
  };

  return (
    <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
      <span className="mr-1 text-[13px]" aria-hidden>
        🌐
      </span>
      <select
        aria-label="Select language"
        className="bg-transparent text-xs outline-none"
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
  );
}

