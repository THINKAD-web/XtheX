export const SUPPORTED_CURRENCIES = ["KRW", "USD", "EUR", "JPY"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Mock FX: 1 unit of currency => KRW */
export const FX_TO_KRW_MOCK: Record<SupportedCurrency, number> = {
  KRW: 1,
  USD: 1350,
  EUR: 1470,
  JPY: 9.1,
};

export function isSupportedCurrency(v: string): v is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(v as SupportedCurrency);
}

export function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
): number {
  if (!Number.isFinite(amount)) return 0;
  const krw = amount * FX_TO_KRW_MOCK[from];
  return krw / FX_TO_KRW_MOCK[to];
}

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function preferredCurrencyFromLocale(locale: string): SupportedCurrency {
  if (locale === "ko") return "KRW";
  if (locale === "ja") return "JPY";
  if (locale === "zh") return "USD";
  return "USD";
}
