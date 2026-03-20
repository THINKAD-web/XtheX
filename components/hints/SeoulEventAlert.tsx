"use client";

import * as React from "react";
import { CalendarDays, TrendingUp, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getActiveSeoulEvents } from "@/lib/hints/seoul-events";

type Props = {
  locale: string;
  tagCodes: string[];
  dismissKey?: string;
  className?: string;
};

export function SeoulEventAlert({
  locale,
  tagCodes,
  dismissKey = "xthex:seoul-event-alert:dismissed:v1",
  className,
}: Props) {
  const isKo = locale === "ko";
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(dismissKey);
      if (v === "1") setDismissed(true);
    } catch {
      // ignore
    }
  }, [dismissKey]);

  const active = React.useMemo(() => getActiveSeoulEvents(tagCodes), [tagCodes]);
  const top = active[0];
  if (!top || dismissed) return null;

  const name = isKo ? top.nameKo : top.nameEn;
  const area = isKo ? top.areaKo : top.areaEn;
  const boost = isKo ? top.boostKo : top.boostEn;
  const boostPercent = typeof (top as any).boostPercent === "number" ? (top as any).boostPercent : 30;

  return (
    <Alert variant="warning" className={className}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-800">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <AlertTitle>
              {isKo ? "현재 서울 이벤트" : "Seoul event now"}: {name}{" "}
              <span className="text-amber-900/80">
                {isKo ? `진행 중 → 이 매체 효과 +${boostPercent}% 예상` : `Live → +${boostPercent}% lift expected`}
              </span>
              {area ? <span className="text-amber-900/70"> · {area}</span> : null}
            </AlertTitle>
            <AlertDescription>
              <div className="flex items-start gap-2">
                <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
                <p className="text-amber-950/90">{boost}</p>
              </div>
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
          aria-label={isKo ? "이벤트 알림 닫기" : "Dismiss event alert"}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}

