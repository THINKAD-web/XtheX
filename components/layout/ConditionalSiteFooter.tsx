"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * /admin/* 에서는 렌더하지 않음(admin 레이아웃에서 SiteFooter 사용).
 */
export function ConditionalSiteFooter() {
  const pathname = usePathname();
  const t = useTranslations("home.footer");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();

  if (pathname?.includes("/admin")) {
    return null;
  }

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">XtheX</span>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("copyright", { year })}
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-6 text-sm sm:justify-end">
          <Link
            href="/about"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t("about")}
          </Link>
          <Link
            href="/community"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {tNav("community")}
          </Link>
          <Link
            href="/contact"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t("contact")}
          </Link>
          <Link
            href="/terms"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t("terms")}
          </Link>
          <Link
            href="/help"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t("help")}
          </Link>
          <Link
            href="/developers"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {t("developers")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
