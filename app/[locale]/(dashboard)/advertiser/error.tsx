"use client";

import { useEffect } from "react";
import { ErrorBoundaryUI } from "@/components/ui/error-boundary-ui";

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
    <ErrorBoundaryUI
      title="캠페인을 불러오지 못했습니다"
      description={error.message || "잠시 후 다시 시도해 주세요."}
      error={error}
      reset={reset}
      homeHref="/dashboard/advertiser"
      homeLabel="대시보드"
    />
  );
}
