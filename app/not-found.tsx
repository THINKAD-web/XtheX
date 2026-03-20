"use client";

import * as React from "react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import koMessages from "@/messages/ko.json";

function NotFoundContent() {
  const t = useTranslations("notFound");
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("home.footer");
  const router = useRouter();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            XtheX
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  {tNav("sign_in")}
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">{tNav("sign_up")}</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-1 items-center justify-center px-4 pb-16 pt-24">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            404
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            {t("subtitle")}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => router.push("/")}>
              {t("home")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/explore")}
            >
              {t("explore")}
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {tFooter("copyright", { year })}
          </p>
          <nav className="flex gap-6 text-sm">
            <Link
              href="/about"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {tFooter("about")}
            </Link>
            <Link
              href="/contact"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {tFooter("contact")}
            </Link>
            <Link
              href="/terms"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {tFooter("terms")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Root 404 is outside [locale] layout — provide intl context so hooks work. */
export default function NotFound() {
  return (
    <NextIntlClientProvider
      locale="ko"
      messages={koMessages}
      timeZone="Asia/Seoul"
    >
      <NotFoundContent />
    </NextIntlClientProvider>
  );
}
