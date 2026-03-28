"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DOOH_CAMPAIGN_ONBOARDING_STEPS } from "./dooh-campaign-onboarding";

type Props = {
  locale: string;
  storageKey?: string;
  /** If true, do not auto-open on mount */
  disabled?: boolean;
};

export function DoohCampaignOnboardingModal({
  locale,
  storageKey = "xthex:onboarding:dooh-campaign:v1",
  disabled,
}: Props) {
  const isKo = locale === "ko";
  const steps = DOOH_CAMPAIGN_ONBOARDING_STEPS;
  const [open, setOpen] = React.useState(false);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    if (disabled) return;
    try {
      const seen = window.localStorage.getItem(storageKey) === "1";
      if (!seen) setOpen(true);
    } catch {
      // ignore
    }
  }, [disabled, storageKey]);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  const step = steps[idx]!;
  const title = isKo ? step.titleKo : step.titleEn;
  const body = isKo ? step.bodyKo : step.bodyEn;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-50 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">
              {isKo ? "DOOH 캠페인 3분 만에 만들기" : "Create a DOOH campaign in 3 minutes"}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-full border border-zinc-800 p-2 text-zinc-300 hover:bg-zinc-900"
            aria-label={isKo ? "닫기" : "Close"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-zinc-900/50 p-4 ring-1 ring-zinc-800">
          <p className="text-sm text-zinc-200">{body}</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            {idx + 1} / {steps.length}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
              onClick={() => setIdx((v) => Math.max(0, v - 1))}
              disabled={idx === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {isKo ? "이전" : "Back"}
            </Button>
            {idx < steps.length - 1 ? (
              <Button
                type="button"
                size="sm"
                className={cn("bg-orange-600 text-white hover:bg-orange-700")}
                onClick={() => setIdx((v) => Math.min(steps.length - 1, v + 1))}
              >
                {isKo ? "다음" : "Next"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="bg-orange-600 text-white hover:bg-orange-700"
                onClick={close}
              >
                {isKo ? "시작하기" : "Start"}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500">
          <button
            type="button"
            className="underline underline-offset-2 hover:text-zinc-300"
            onClick={() => {
              try {
                window.localStorage.removeItem(storageKey);
              } catch {}
            }}
          >
            {isKo ? "다음에 다시 보기(리셋)" : "Show again next time (reset)"}
          </button>
          <button
            type="button"
            className="underline underline-offset-2 hover:text-zinc-300"
            onClick={close}
          >
            {isKo ? "다시 보지 않기" : "Don't show again"}
          </button>
        </div>
      </div>
    </div>
  );
}

