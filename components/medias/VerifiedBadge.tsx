"use client";

import { BadgeCheck } from "lucide-react";

type Props = {
  locale: string;
  verifiedDate?: string;
};

export function VerifiedBadge({ locale, verifiedDate }: Props) {
  const isKo = locale === "ko";
  const dateStr =
    verifiedDate ??
    new Date().toLocaleDateString(isKo ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "short",
    });

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
      <BadgeCheck className="h-3.5 w-3.5" />
      {isKo ? "검증됨" : "Verified"}
      <span className="text-emerald-400/70">· {dateStr}</span>
    </span>
  );
}
