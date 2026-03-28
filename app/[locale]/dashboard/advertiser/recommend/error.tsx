"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ErrorBoundaryUI } from "@/components/ui/error-boundary-ui";

export default function AdvertiserRecommendError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("dashboard.advertiser.recommend");

  React.useEffect(() => {
    console.error("[advertiser/recommend]", error.message, error.digest);
  }, [error]);

  return (
    <ErrorBoundaryUI
      title={t("error_title")}
      description={t("error_description")}
      error={error}
      reset={reset}
      homeHref="/dashboard/advertiser"
      homeLabel={t("back")}
      retryLabel={t("error_retry")}
    />
  );
}
