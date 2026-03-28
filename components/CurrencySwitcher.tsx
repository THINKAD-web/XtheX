"use client";

import * as React from "react";
import {
  SUPPORTED_CURRENCIES,
  isSupportedCurrency,
  preferredCurrencyFromLocale,
  CURRENCY_STORAGE_KEY,
  CURRENCY_MANUAL_STORAGE_KEY,
  type SupportedCurrency,
} from "@/lib/currency";

const COOKIE_KEY = "xthex_currency";

type Props = {
  locale: string;
  label: string;
};

export function CurrencySwitcher({ locale, label }: Props) {
  const [currency, setCurrency] = React.useState<SupportedCurrency>(() =>
    preferredCurrencyFromLocale(locale),
  );

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved && isSupportedCurrency(saved)) {
        setCurrency(saved);
        return;
      }
      setCurrency(preferredCurrencyFromLocale(locale));
    } catch {
      setCurrency(preferredCurrencyFromLocale(locale));
    }
  }, [locale]);

  const onChange = (next: string) => {
    if (!isSupportedCurrency(next)) return;
    setCurrency(next);
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, next);
      window.localStorage.setItem(CURRENCY_MANUAL_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    document.cookie = `${COOKIE_KEY}=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("xthex:currency-change", { detail: next }));
  };

  return (
    <label className="inline-flex h-9 items-center gap-1 rounded-md border border-border bg-background px-2.5 text-xs text-foreground shadow-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={currency}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-xs outline-none"
        aria-label={label}
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
