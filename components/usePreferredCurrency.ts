"use client";

import * as React from "react";
import {
  isSupportedCurrency,
  preferredCurrencyFromLocale,
  type SupportedCurrency,
} from "@/lib/currency";

const STORAGE_KEY = "xthex_currency";
const COOKIE_KEY = "xthex_currency";

function readCookieCurrency(): SupportedCurrency | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_KEY}=`));
  if (!cookie) return null;
  const v = decodeURIComponent(cookie.split("=")[1] ?? "");
  return isSupportedCurrency(v) ? v : null;
}

export function usePreferredCurrency(locale: string) {
  const [currency, setCurrency] = React.useState<SupportedCurrency>(() =>
    preferredCurrencyFromLocale(locale),
  );

  React.useEffect(() => {
    const fromStorage = (() => {
      try {
        const v = window.localStorage.getItem(STORAGE_KEY);
        return v && isSupportedCurrency(v) ? v : null;
      } catch {
        return null;
      }
    })();
    setCurrency(fromStorage ?? readCookieCurrency() ?? preferredCurrencyFromLocale(locale));
  }, [locale]);

  React.useEffect(() => {
    const onCurrencyChange = (e: Event) => {
      const next = (e as CustomEvent<string>).detail;
      if (typeof next === "string" && isSupportedCurrency(next)) setCurrency(next);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = e.newValue;
      if (next && isSupportedCurrency(next)) setCurrency(next);
    };

    window.addEventListener("xthex:currency-change", onCurrencyChange as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("xthex:currency-change", onCurrencyChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return currency;
}
