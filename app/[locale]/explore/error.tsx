"use client";

import { ErrorBoundaryUI } from "@/components/ui/error-boundary-ui";

export default function ExploreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundaryUI
      title="탐색 페이지 오류"
      description="매체 목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      error={error}
      reset={reset}
      homeHref="/explore"
      homeLabel="탐색으로"
    />
  );
}
