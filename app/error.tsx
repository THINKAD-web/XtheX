"use client";

import { useEffect } from "react";
import { ErrorBoundaryUI } from "@/components/ui/error-boundary-ui";

export default function Error({
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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      {/* Subtle dot pattern background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative z-10 w-full">
        <ErrorBoundaryUI
          title="문제가 발생했습니다"
          description="일시적인 오류입니다. 잠시 후 다시 시도해 주세요."
          error={error}
          reset={reset}
        />
      </div>
    </div>
  );
}
