import type { RecommendationCurrency } from "@/lib/recommend/recommendations-ui-types";

// TODO: Replace with live FX source or pricing service.
const FX_TO_KRW: Record<RecommendationCurrency, number> = {
  KRW: 1,
  USD: 1350,
  EUR: 1470,
  JPY: 9.1,
};

export function toKrw(amount: number, currency: RecommendationCurrency): number {
  return amount * FX_TO_KRW[currency];
}

export function fromKrw(
  amountKrw: number,
  currency: RecommendationCurrency,
): number {
  return amountKrw / FX_TO_KRW[currency];
}

export function formatCurrency(
  amount: number,
  currency: RecommendationCurrency,
): string {
  const localeMap: Record<RecommendationCurrency, string> = {
    KRW: "ko-KR",
    USD: "en-US",
    EUR: "de-DE",
    JPY: "ja-JP",
  };
  return new Intl.NumberFormat(localeMap[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
