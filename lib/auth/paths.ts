import { getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

/** Localized login path for redirects (respects `localePrefix: "as-needed"`). */
export async function getLoginPath(): Promise<string> {
  const locale = await getLocale();
  if (locale === routing.defaultLocale) return "/login";
  return `/${locale}/login`;
}

export async function getSignupPath(): Promise<string> {
  const locale = await getLocale();
  if (locale === routing.defaultLocale) return "/signup";
  return `/${locale}/signup`;
}

/** Path with optional `/{locale}` prefix when not default (matches `localePrefix: "as-needed"`). */
export async function getLocalizedPath(path: string): Promise<string> {
  const locale = await getLocale();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (locale === routing.defaultLocale) return p;
  return `/${locale}${p}`;
}
