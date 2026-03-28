import { appLocaleToBcp47 } from "@/lib/i18n/locale-config";

export function formatAppDate(
  input: string | Date,
  appLocale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  const fmtOpts: Intl.DateTimeFormatOptions =
    options && Object.keys(options).length > 0 ? options : { dateStyle: "medium" };
  return new Intl.DateTimeFormat(appLocaleToBcp47(appLocale), fmtOpts).format(d);
}
