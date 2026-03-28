"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { appLocaleToHtmlLang } from "@/lib/i18n/locale-config";

/** Syncs `<html lang>` with the active next-intl locale (root layout defaults to ko). */
export function DocumentLang() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = appLocaleToHtmlLang(locale);
  }, [locale]);

  return null;
}
