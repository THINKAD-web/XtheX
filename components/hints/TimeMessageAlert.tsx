"use client";

import * as React from "react";
import { Clock, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getTimeMessageHints } from "@/lib/hints/time-messages";

type Props = {
  locale: string;
  tagCodes: string[];
  dismissKey?: string;
  className?: string;
};

export function TimeMessageAlert({
  locale,
  tagCodes,
  dismissKey = "xthex:time-message-alert:dismissed:v1",
  className,
}: Props) {
  const isKo = locale === "ko";
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

  const hint = React.useMemo(() => {
    const [top] = getTimeMessageHints({
      tagCodes,
      hour: typeof hour === "number" ? hour : undefined,
    });
    return top ?? null;
  }, [tagCodes, hour]);

  if (!hint || dismissed) return null;

  const title = isKo ? hint.titleKo : hint.titleEn;
  const body = isKo ? hint.bodyKo : hint.bodyEn;

  return (
    <Alert variant="warning" className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
          <div>
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
              <p className="text-amber-950/90">{body}</p>
            </AlertDescription>
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
          aria-label={isKo ? "메시지 추천 닫기" : "Dismiss message suggestion"}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

