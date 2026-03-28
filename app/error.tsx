"use client";

import { useEffect } from "react";
import { ErrorBoundaryUI } from "@/components/ui/error-boundary-ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorBoundaryUI
      title="문제가 발생했습니다"
      description="일시적인 오류입니다. 잠시 후 다시 시도해 주세요."
      error={error}
      reset={reset}
    />
  );
}
