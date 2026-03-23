"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { landing } from "@/lib/landing-theme";

export default function AdvertiserError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[advertiser]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div
        className={`${landing.container} flex flex-col items-center justify-center gap-6 py-24 text-center`}
      >
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          캠페인을 불러오지 못했습니다
        </h1>
        <p className="max-w-md text-pretty text-zinc-600 dark:text-zinc-400">
          {error.message || "잠시 후 다시 시도해 주세요."}
        </p>
        <Button
          type="button"
          className="h-11 rounded-lg px-6 font-medium"
          onClick={() => reset()}
        >
          다시 시도
        </Button>
      </div>
    </div>
  );
}
