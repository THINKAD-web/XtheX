"use client";

import { useState } from "react";
import { X, Percent } from "lucide-react";

type Props = {
  locale: string;
  contactHref: string;
};

export function DiscountBanner({ locale, contactHref }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const isKo = locale === "ko";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-4 shadow-lg shadow-orange-500/20">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10" />
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white"
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Percent className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            {isKo ? "지금 문의하면 10% 할인!" : "Inquire Now & Get 10% Off!"}
          </p>
          <p className="text-xs text-white/80">
            {isKo
              ? "첫 캠페인 한정 특별 할인 혜택"
              : "Special discount for your first campaign"}
          </p>
        </div>
      </div>
      <a
        href={contactHref}
        className="mt-3 flex w-full items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-orange-600 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isKo ? "지금 할인 받기" : "Claim Discount"}
      </a>
    </div>
  );
}
