"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getAbMessageVariants } from "@/lib/hints/ab-message-variants";

type Props = {
  locale: string;
  tagCodes: string[];
  className?: string;
};

export function AbMessageVariantsCard({ locale, tagCodes, className }: Props) {
  const isKo = locale === "ko";
  const variants = React.useMemo(
    () => getAbMessageVariants({ tagCodes }),
    [tagCodes],
  );

  if (variants.length === 0) return null;

  return (
    <Card className={className ?? "border-zinc-200 bg-white text-zinc-950 shadow-sm"}>
      <CardHeader className="p-4">
        <CardTitle className="text-sm">
          {isKo ? "A/B 메시지 변형 3개 추천" : "3 A/B message variants"}
        </CardTitle>
        <p className="mt-1 text-xs text-zinc-500">
          {isKo
            ? "타겟팅 태그를 기반으로 메시지 톤을 3개로 변형해 추천합니다. (클릭해서 복사)"
            : "Rule-based variants from targeting tags. (Click to copy)"}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 p-4 pt-0">
        {variants.map((v) => {
          const label = isKo ? v.labelKo : v.labelEn;
          const text = isKo ? v.textKo : v.textEn;
          return (
            <button
              key={v.id}
              type="button"
              className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-left hover:bg-zinc-50"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text);
                  toast.success(isKo ? "복사 완료" : "Copied", { description: text });
                } catch {
                  toast.error(isKo ? "복사 실패" : "Copy failed", {
                    description: isKo
                      ? "클립보드 권한을 확인해 주세요."
                      : "Check clipboard permission.",
                  });
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="border-zinc-300 bg-zinc-50 text-zinc-700">
                  {label}
                </Badge>
                <span className="text-xs text-zinc-400">{isKo ? "클릭-복사" : "Click to copy"}</span>
              </div>
              <div className="mt-2 text-sm font-medium text-zinc-900">
                {text}
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

