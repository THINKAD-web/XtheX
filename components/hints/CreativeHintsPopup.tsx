"use client";

import * as React from "react";
import { Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCreativeHints, type CreativeHintContext } from "@/lib/hints/creatives";

type Props = {
  locale: string;
  context: CreativeHintContext;
  className?: string;
  compact?: boolean;
  variant?: "card" | "button";
  /** if provided, auto-open once when context signature changes */
  autoOpenOnceKey?: string;
  tone?: "dark" | "light";
};

export function CreativeHintsPopup({
  locale,
  context,
  className,
  compact = false,
  variant = "card",
  autoOpenOnceKey,
  tone = "dark",
}: Props) {
  const isKo = locale === "ko";
  const light = tone === "light";
  const hints = React.useMemo(() => getCreativeHints(context), [context]);
  const [open, setOpen] = React.useState(false);

  if (hints.length === 0) return null;

  const signature = React.useMemo(() => {
    const codes = (context.tagCodes ?? []).slice().sort().join(",");
    const weather = context.weatherMain ?? "";
    const hour = typeof context.hour === "number" ? String(context.hour) : "";
    const name = context.mediaName ?? "";
    return [codes, weather, hour, name].join("|");
  }, [context.hour, context.mediaName, context.tagCodes, context.weatherMain]);

  React.useEffect(() => {
    if (!autoOpenOnceKey) return;
    if (typeof window === "undefined") return;
    if (!signature) return;

    const seenKey = `xthex:${autoOpenOnceKey}:opened`;
    const lastSigKey = `xthex:${autoOpenOnceKey}:lastSig`;
    const alreadyOpened = window.localStorage.getItem(seenKey) === "1";
    const lastSig = window.localStorage.getItem(lastSigKey) ?? "";

    if (!alreadyOpened && signature !== lastSig) {
      window.localStorage.setItem(lastSigKey, signature);
      window.localStorage.setItem(seenKey, "1");
      setOpen(true);
    } else if (signature !== lastSig) {
      window.localStorage.setItem(lastSigKey, signature);
    }
  }, [autoOpenOnceKey, signature]);

  if (variant === "button") {
    return (
      <div className={className}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "border-orange-500/40 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20",
            compact && "h-7 px-2 text-[11px]",
          )}
          onClick={() => setOpen(true)}
        >
          {isKo ? "힌트" : "Hints"}
        </Button>
        {open ? (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-50 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {isKo ? "추천 크리에이티브 가이드" : "Recommended creative guide"}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    {isKo
                      ? "LLM 없이도 룰 기반으로 'AI 느낌'을 주는 추천입니다."
                      : "Rule-based recommendations to deliver an AI-like experience without LLMs."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-zinc-800 p-2 text-zinc-300 hover:bg-zinc-900"
                  aria-label={isKo ? "닫기" : "Close"}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {hints.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
                  >
                    <p className="text-sm font-semibold text-orange-200">
                      {isKo ? h.titleKo : h.titleEn}
                    </p>
                    <p className="mt-2 text-sm text-zinc-200">
                      {isKo ? h.bodyKo : h.bodyEn}
                    </p>
                    {h.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {h.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                  onClick={() => setOpen(false)}
                >
                  {isKo ? "닫기" : "Close"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={cn(
          light
            ? "rounded-xl border border-zinc-200 bg-white p-3 text-zinc-900 shadow-sm"
            : "rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-zinc-100",
          compact &&
            (light
              ? "border-zinc-200 bg-white p-2"
              : "border-zinc-700 bg-zinc-950/60 p-2"),
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Lightbulb
              className={cn("mt-0.5 h-4 w-4", light ? "text-orange-600" : "text-orange-300")}
            />
            <div>
              <p className={cn("text-sm font-medium", compact && "text-xs")}>
                {isKo
                  ? "크리에이티브 힌트"
                  : "Creative hints"}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs",
                  light ? "text-zinc-600" : "text-zinc-400",
                  compact && "hidden",
                )}
              >
                {isKo
                  ? "선택한 타겟팅/컨텍스트에 맞춘 룰 기반 추천입니다."
                  : "Rule-based recommendations based on your targeting/context."}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              light
                ? "border-zinc-300 text-zinc-800 hover:bg-zinc-100"
                : "border-zinc-700 text-zinc-200 hover:bg-zinc-800",
              compact && "h-8 px-2 text-xs",
            )}
            onClick={() => setOpen(true)}
          >
            {isKo ? "보기" : "View"}
          </Button>
        </div>

        <div className={cn("mt-2 flex flex-wrap gap-1.5", compact && "hidden")}>
          {hints.map((h) => (
            <Badge
              key={h.id}
              variant="outline"
              className={
                light
                  ? "border-orange-300 bg-orange-50 text-orange-800"
                  : "border-orange-500/40 bg-orange-500/10 text-orange-200"
              }
            >
              {isKo ? h.titleKo : h.titleEn}
            </Badge>
          ))}
        </div>
      </div>

      {open ? (
        <div
          className={cn(
            "fixed inset-0 z-[110] flex items-center justify-center p-4",
            light ? "bg-black/40" : "bg-black/60",
          )}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={cn(
              "w-full max-w-xl rounded-xl border p-5 shadow-xl",
              light
                ? "border-zinc-200 bg-white text-zinc-900"
                : "border-zinc-800 bg-zinc-950 text-zinc-50",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {isKo ? "추천 크리에이티브 가이드" : "Recommended creative guide"}
                </h2>
                <p className={light ? "mt-1 text-xs text-zinc-600" : "mt-1 text-xs text-zinc-400"}>
                  {isKo
                    ? "LLM 없이도 룰 기반으로 'AI 느낌'을 주는 추천입니다."
                    : "Rule-based recommendations to deliver an AI-like experience without LLMs."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={
                  light
                    ? "rounded-md border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-100"
                    : "rounded-md border border-zinc-800 p-2 text-zinc-300 hover:bg-zinc-900"
                }
                aria-label={isKo ? "닫기" : "Close"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {hints.map((h) => (
                <div
                  key={h.id}
                  className={
                    light
                      ? "rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                      : "rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
                  }
                >
                  <p
                    className={
                      light
                        ? "text-sm font-semibold text-orange-700"
                        : "text-sm font-semibold text-orange-200"
                    }
                  >
                    {isKo ? h.titleKo : h.titleEn}
                  </p>
                  <p className={light ? "mt-2 text-sm text-zinc-700" : "mt-2 text-sm text-zinc-200"}>
                    {isKo ? h.bodyKo : h.bodyEn}
                  </p>
                  {h.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {h.tags.map((t) => (
                        <span
                          key={t}
                          className={
                            light
                              ? "rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] text-zinc-700"
                              : "rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300"
                          }
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className={
                  light
                    ? "border-zinc-300 text-zinc-800 hover:bg-zinc-100"
                    : "border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                }
                onClick={() => setOpen(false)}
              >
                {isKo ? "닫기" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

