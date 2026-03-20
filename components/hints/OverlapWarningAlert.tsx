"use client";

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import { getOverlapWarnings } from "@/lib/hints/overlap-rules";

type Props = {
  locale: string;
  tagCodes: string[];
  className?: string;
};

export function OverlapWarningAlert({ locale, tagCodes, className }: Props) {
  const isKo = locale === "ko";
  const warnings = React.useMemo(() => getOverlapWarnings(tagCodes), [tagCodes]);
  const top = warnings[0];

  if (!top) return null;

  const msg = isKo ? top.messageKo : top.messageEn;

  return (
    <Alert variant="warning" className={className}>
      <div className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
        <div>
          <AlertTitle className="text-xs font-semibold">
            {isKo ? "타겟팅 중복도 경고" : "Target overlap warning"}
          </AlertTitle>
          <AlertDescription className="text-xs text-amber-900">
            {msg}{" "}
            {isKo
              ? "겹치는 세그먼트를 줄이면 예산 효율이 더 좋아질 수 있습니다."
              : "Reducing overlapping segments can improve budget efficiency."}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

