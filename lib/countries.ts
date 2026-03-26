import type { SupportedCurrency } from "@/lib/currency";

export type CountryInfo = {
  code: string;
  name: { ko: string; en: string; ja: string; zh: string };
  currency: SupportedCurrency;
  timezone: string;
};

export const COUNTRY_MAP: Record<string, CountryInfo> = {
  KR: {
    code: "KR",
    name: { ko: "대한민국", en: "Korea", ja: "韓国", zh: "韩国" },
    currency: "KRW",
    timezone: "Asia/Seoul",
  },
  US: {
    code: "US",
    name: { ko: "미국", en: "United States", ja: "アメリカ", zh: "美国" },
    currency: "USD",
    timezone: "America/New_York",
  },
  JP: {
    code: "JP",
    name: { ko: "일본", en: "Japan", ja: "日本", zh: "日本" },
    currency: "JPY",
    timezone: "Asia/Tokyo",
  },
  CN: {
    code: "CN",
    name: { ko: "중국", en: "China", ja: "中国", zh: "中国" },
    currency: "USD",
    timezone: "Asia/Shanghai",
  },
  GB: {
    code: "GB",
    name: { ko: "영국", en: "United Kingdom", ja: "イギリス", zh: "英国" },
    currency: "EUR",
    timezone: "Europe/London",
  },
};

export function getCountryInfo(code: string): CountryInfo | null {
  return COUNTRY_MAP[code.toUpperCase()] ?? null;
}
