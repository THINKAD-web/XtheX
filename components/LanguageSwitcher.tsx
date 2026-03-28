"use client";

import { useLocale } from "next-intl";
import { ChevronDown, Check } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SUPPORTED_LOCALES = ["ko", "en", "ja", "zh"] as const;

type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_META: Record<LocaleCode, { flag: string; label: string }> = {
  ko: { flag: "🇰🇷", label: "한국어" },
  en: { flag: "🇺🇸", label: "English" },
  ja: { flag: "🇯🇵", label: "日本語" },
  zh: { flag: "🇨🇳", label: "中文" },
};

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale() as LocaleCode;

  const handleChange = (nextLocale: string) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale as LocaleCode)) return;
    if (nextLocale === activeLocale) return;
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${pathname}${search}`, { locale: nextLocale });
    router.refresh();
  };

  const active = LOCALE_META[activeLocale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3",
            "text-xs font-medium text-foreground shadow-sm",
            "transition-all duration-200",
            "hover:bg-muted/60 hover:shadow-md",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
          aria-label="Language switcher"
        >
          <span className="text-sm leading-none">{active.flag}</span>
          <span className="hidden sm:inline">{activeLocale.toUpperCase()}</span>
          <ChevronDown className="h-3 w-3 opacity-60 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[160px] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
      >
        {SUPPORTED_LOCALES.map((code) => {
          const meta = LOCALE_META[code];
          const isActive = activeLocale === code;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => handleChange(code)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive && "bg-accent font-semibold",
              )}
            >
              <span className="text-base leading-none">{meta.flag}</span>
              <span className="flex-1">{meta.label}</span>
              {isActive && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
