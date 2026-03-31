"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { HomeRoleCtas } from "@/components/home/home-role-ctas";
import { landing } from "@/lib/landing-theme";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "xthex_beta_notice_dismissed";

export function BetaNoticebar() {
  /** null = not mounted yet (avoid SSR/client localStorage mismatch) */
  const [visible, setVisible] = useState<boolean | null>(null);
  const tHero = useTranslations("home.hero");
  const tNotice = useTranslations("home.betaNotice");

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setVisible(!dismissed);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (visible === null || !visible) return null;

  return (
    <section className="border-b border-zinc-200/80 bg-white/90 py-4 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className={`${landing.container} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex items-center gap-2">
          <div className="inline-flex w-fit items-center rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-400/40 dark:bg-blue-950/30 dark:text-blue-200">
            {tNotice("badge")}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={tNotice("dismiss_aria")}
            className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <HomeRoleCtas
          mediaLabel={tHero("cta_partner")}
          advertiserLabel={tHero("cta_explore")}
          mediaClassName="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500"
          advertiserClassName="inline-flex h-10 items-center justify-center rounded-md border border-blue-300 px-5 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-400/40 dark:text-blue-200 dark:hover:bg-blue-950/30"
        />
      </div>
    </section>
  );
}
