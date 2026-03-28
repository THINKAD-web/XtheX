"use client";

import { ErrorBoundaryUI } from "@/components/ui/error-boundary-ui";

export default function AdminReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundaryUI
      title="검토 페이지 오류"
      description="매체 검토 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
      error={error}
      reset={reset}
      homeHref="/admin/medias"
      homeLabel="미디어 목록"
    />
  );
}
