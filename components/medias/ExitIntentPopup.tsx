"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Gift } from "lucide-react";

type Props = {
  locale: string;
  contactHref: string;
};

export function ExitIntentPopup({ locale, contactHref }: Props) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      if (e.clientY <= 5 && !dismissed) {
        setShow(true);
      }
    },
    [dismissed],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem("xthex_exit_intent_shown");
    if (seen) return;

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [handleMouseLeave]);

  const close = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("xthex_exit_intent_shown", "1");
  };

  if (!show) return null;

  const isKo = locale === "ko";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md animate-in fade-in zoom-in-95 rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900">
        <button
          onClick={close}
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/20">
            <Gift className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {isKo ? "잠깐만요!" : "Wait!"}
          </h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {isKo
              ? "떠나시기 전에, 첫 캠페인 10% 할인 혜택을 놓치지 마세요."
              : "Before you go, don't miss 10% off your first campaign."}
          </p>
          <a
            href={contactHref}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-400 hover:shadow-xl animate-cta-pulse"
          >
            {isKo ? "할인 혜택 받기" : "Get My Discount"}
          </a>
          <button
            onClick={close}
            className="mt-3 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {isKo ? "괜찮습니다, 다음에 할게요" : "No thanks, maybe later"}
          </button>
        </div>
      </div>
    </div>
  );
}
