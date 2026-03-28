"use client";

import { ErrorBoundaryUI } from "@/components/ui/error-boundary-ui";

export default function PartnerDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundaryUI
      title="파트너 대시보드 오류"
      description="대시보드 데이터를 불러오지 못했습니다. 네트워크를 확인하고 다시 시도해 주세요."
      error={error}
      reset={reset}
      homeHref="/dashboard/partner"
      homeLabel="대시보드"
    />
  );
}
