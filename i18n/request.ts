import { getRequestConfig } from "next-intl/server";
import { defaultTimeZoneForLocale } from "@/lib/i18n/locale-config";

const locales = ["ko", "en", "ja", "zh", "es"] as const;
const defaultLocale = "ko";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = defaultLocale;
  }

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: defaultTimeZoneForLocale(locale),
  };
});
