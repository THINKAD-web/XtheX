/**
 * App locale codes (next-intl) ↔ BCP-47, IANA time zones, and calendar regions.
 */

export const APP_LOCALES = ["ko", "en", "ja", "zh", "es"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export function isAppLocale(v: string): v is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(v);
}

/** BCP-47 tag for Intl formatters */
export function appLocaleToBcp47(locale: string): string {
  switch (locale) {
    case "ko":
      return "ko-KR";
    case "ja":
      return "ja-JP";
    case "zh":
      return "zh-CN";
    case "es":
      return "es-ES";
    default:
      return "en-US";
  }
}

/** `<html lang>` — same as BCP-47 for our locales */
export function appLocaleToHtmlLang(locale: string): string {
  return appLocaleToBcp47(locale);
}

/** Default IANA time zone for scheduling copy and next-intl (per UI language) */
export function defaultTimeZoneForLocale(locale: string): string {
  switch (locale) {
    case "ko":
      return "Asia/Seoul";
    case "ja":
      return "Asia/Tokyo";
    case "zh":
      return "Asia/Shanghai";
    case "es":
      return "Europe/Madrid";
    default:
      return "America/New_York";
  }
}

export type CalendarRegion = "KR" | "US" | "JP" | "CN" | "ES";

/** Region used for recurring public-holiday hints in the availability grid */
export function calendarRegionForLocale(locale: string): CalendarRegion {
  switch (locale) {
    case "ko":
      return "KR";
    case "ja":
      return "JP";
    case "zh":
      return "CN";
    case "es":
      return "ES";
    default:
      return "US";
  }
}

/** @deprecated use appLocaleToBcp47 */
export function intlLocaleForApp(locale: string): string {
  return appLocaleToBcp47(locale);
}
