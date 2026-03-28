"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Globe, Map, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "xthex:welcome-modal:v1";

const STEP_ICONS = [Megaphone, Map, Globe] as const;

export function WelcomeModal() {
  const { status } = useSession();
  const t = useTranslations("welcome");
  const [open, setOpen] = React.useState(false);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (status !== "authenticated") return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "1") {
        setOpen(true);
      }
    } catch {
      /* SSR / storage unavailable */
    }
  }, [status]);

  const close = React.useCallback(() => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  if (!open) return null;

  const steps = [
    { title: t("step1_title"), desc: t("step1_desc") },
    { title: t("step2_title"), desc: t("step2_desc") },
    { title: t("step3_title"), desc: t("step3_desc") },
  ];

  const step = steps[idx]!;
  const Icon = STEP_ICONS[idx]!;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-50 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
            {t("badge")}
          </p>
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Icon + Content */}
        <div className="mt-6 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-600/20">
            <Icon className="h-8 w-8 text-orange-400" />
          </div>
          <h2 className="mt-4 text-xl font-bold">{step.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            {step.desc}
          </p>
        </div>

        {/* Dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === idx ? "w-6 bg-orange-500" : "w-2 bg-zinc-700",
              )}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
            onClick={() => setIdx((v) => Math.max(0, v - 1))}
            disabled={idx === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t("prev")}
          </Button>
          {idx < steps.length - 1 ? (
            <Button
              type="button"
              size="sm"
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => setIdx((v) => v + 1)}
            >
              {t("next")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={close}
            >
              {t("start")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
