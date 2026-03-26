"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function AdvertiserRecommendError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("dashboard.advertiser.recommend");

  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[advertiser/recommend]", error.message, error.digest);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {t("error_title")}
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("error_description")}
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="max-h-32 w-full overflow-auto rounded-md border border-red-200 bg-red-50 p-2 text-left text-xs text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error.message}
        </pre>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={() => reset()} variant="default">
          {t("error_retry")}
        </Button>
        <Link
          href="/dashboard/advertiser"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
