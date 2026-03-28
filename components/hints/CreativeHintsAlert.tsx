"use client";

import * as React from "react";
import { CloudRain, Lightbulb, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getCreativeHints } from "@/lib/hints/creatives";
import { getCreativeCopySuggestions } from "@/lib/hints/creative-copies";

type Props = {
  locale: string;
  tagCodes: string[];
  city?: string;
  dismissKey?: string; // localStorage key for "dismissed"
  className?: string;
};

export function CreativeHintsAlert({
  locale,
  tagCodes,
  city = "Seoul",
  dismissKey = "xthex:creative-hints-alert:dismissed:v1",
  className,
}: Props) {
  const isKo = locale === "ko";
  const [condition, setCondition] = React.useState<string>("default");
  const [hour, setHour] = React.useState<number | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    setHour(new Date().getHours());
    try {
      const v = localStorage.getItem(dismissKey);
      if (v === "1") setDismissed(true);
    } catch {
      // ignore
    }
  }, [dismissKey]);

  React.useEffect(() => {
    const q = city ? `?city=${encodeURIComponent(city)}` : "?city=Seoul,KR";
    fetch(`/api/weather${q}`)
      .then((r) => r.json())
      .then((d) => setCondition(d.condition ?? "default"))
      .catch(() => setCondition("default"));
  }, [city]);

  const hints = React.useMemo(() => {
    return getCreativeHints({
      tagCodes,
      weatherMain: condition,
      hour: typeof hour === "number" ? hour : undefined,
    });
  }, [tagCodes, condition, hour]);

  const copySuggestions = React.useMemo(() => {
    return getCreativeCopySuggestions(
      {
        tagCodes,
        weatherMain: condition,
        hour: typeof hour === "number" ? hour : undefined,
      },
      3,
    );
  }, [tagCodes, condition, hour]);

  const top = hints[0];
  if (!top || dismissed) return null;

  const title = isKo ? top.titleKo : top.titleEn;
  const body = isKo ? top.bodyKo : top.bodyEn;
  const isRain = (condition ?? "").toLowerCase().includes("rain") || (condition ?? "").toLowerCase().includes("drizzle");

  return (
    <Alert variant="warning" className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {isRain ? (
            <CloudRain className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
          ) : (
            <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
          )}
          <div>
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
              <p className="text-amber-950/90">{body}</p>
            </AlertDescription>

            {copySuggestions.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-medium text-amber-900/80">
                  {isKo ? "추천 한 줄 카피 (클릭해서 복사)" : "One-line copy (click to copy)"}
                </p>
                <div className="flex flex-col gap-1.5">
                  {copySuggestions.map((c) => {
                    const text = isKo ? c.textKo : c.textEn;
                    const note = isKo ? c.noteKo : c.noteEn;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className="rounded-md border border-amber-200/80 bg-white/60 px-2.5 py-2 text-left hover:bg-white"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(text);
                            toast.success(isKo ? "복사 완료" : "Copied", { description: text });
                          } catch {
                            toast.error(isKo ? "복사 실패" : "Copy failed", {
                              description: isKo
                                ? "브라우저 권한 문제로 복사에 실패했어요."
                                : "Clipboard permission blocked.",
                            });
                          }
                        }}
                      >
                        <div className="text-sm text-amber-950">{text}</div>
                        {note ? (
                          <div className="mt-1 text-xs text-amber-900/70">
                            {note}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="h-7 w-7 p-0 text-amber-900/70 hover:bg-amber-100 hover:text-amber-900"
          onClick={() => {
            setDismissed(true);
            try {
              localStorage.setItem(dismissKey, "1");
            } catch {
              // ignore
            }
          }}
          aria-label={isKo ? "크리에이티브 힌트 닫기" : "Dismiss creative hint"}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

