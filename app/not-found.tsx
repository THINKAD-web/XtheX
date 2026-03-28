"use client";

import * as React from "react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { Home, Compass } from "lucide-react";
import koMessages from "@/messages/ko.json";

function LostBillboardSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Ground line */}
      <path
        d="M20 195 Q70 190 140 195 Q210 200 260 195"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-zinc-300 dark:text-zinc-700"
      />
      {/* Billboard post */}
      <rect
        x="125"
        y="100"
        width="6"
        height="95"
        rx="2"
        className="fill-zinc-400 dark:fill-zinc-600"
      />
      <rect
        x="143"
        y="110"
        width="5"
        height="85"
        rx="2"
        className="fill-zinc-400 dark:fill-zinc-600"
      />
      {/* Billboard frame - tilted slightly for "lost" feel */}
      <g transform="rotate(-6, 140, 70)">
        <rect
          x="60"
          y="30"
          width="160"
          height="90"
          rx="6"
          className="fill-emerald-50 dark:fill-emerald-950"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{ color: "#059669" }}
        />
        <rect
          x="68"
          y="38"
          width="144"
          height="74"
          rx="3"
          className="fill-white dark:fill-zinc-900"
        />
        {/* Question mark on the billboard */}
        <text
          x="140"
          y="88"
          textAnchor="middle"
          className="fill-emerald-500 dark:fill-emerald-400"
          fontSize="42"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          ?
        </text>
      </g>
      {/* Traveler figure */}
      <g transform="translate(50, 130)">
        {/* Head */}
        <circle cx="12" cy="8" r="8" className="fill-zinc-400 dark:fill-zinc-500" />
        {/* Body */}
        <path
          d="M12 16 L12 42"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-zinc-400 dark:text-zinc-500"
        />
        {/* Left arm - raised scratching head */}
        <path
          d="M12 24 L0 16"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-zinc-400 dark:text-zinc-500"
        />
        {/* Right arm */}
        <path
          d="M12 24 L24 32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-zinc-400 dark:text-zinc-500"
        />
        {/* Left leg */}
        <path
          d="M12 42 L4 60"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-zinc-400 dark:text-zinc-500"
        />
        {/* Right leg */}
        <path
          d="M12 42 L22 60"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-zinc-400 dark:text-zinc-500"
        />
        {/* Backpack */}
        <rect
          x="14"
          y="18"
          width="8"
          height="14"
          rx="3"
          className="fill-emerald-400 dark:fill-emerald-600"
        />
      </g>
      {/* Small decorative dots */}
      <circle cx="220" cy="160" r="2" className="fill-emerald-300 dark:fill-emerald-700" />
      <circle cx="235" cy="172" r="1.5" className="fill-emerald-200 dark:fill-emerald-800" />
      <circle cx="45" cy="175" r="1.5" className="fill-zinc-300 dark:fill-zinc-700" />
    </svg>
  );
}

function NotFoundContent() {
  const t = useTranslations("notFound");
  const tFooter = useTranslations("home.footer");
  const router = useRouter();
  const year = new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg text-center">
          {/* SVG illustration */}
          <LostBillboardSVG className="mx-auto mb-8 h-44 w-auto sm:h-52" />

          {/* 404 gradient number */}
          <p
            className="mb-3 text-7xl font-extrabold tracking-tighter sm:text-8xl"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #3b82f6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </p>

          {/* Title & subtitle */}
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
            {t("subtitle")}
          </p>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              size="lg"
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              onClick={() => router.push("/")}
            >
              <Home className="mr-2 h-4 w-4" />
              {t("home")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => router.push("/explore")}
            >
              <Compass className="mr-2 h-4 w-4" />
              {t("explore")}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-900">
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
