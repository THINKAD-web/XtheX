"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type Props = {
  title?: string;
  description?: string;
  error?: Error & { digest?: string };
  reset?: () => void;
  homeHref?: string;
  homeLabel?: string;
  retryLabel?: string;
  showDetails?: boolean;
};

export function ErrorBoundaryUI({
  title = "문제가 발생했습니다",
  description = "일시적인 오류입니다. 잠시 후 다시 시도해 주세요.",
  error,
  reset,
  homeHref = "/",
  homeLabel = "홈으로",
  retryLabel = "다시 시도",
  showDetails = process.env.NODE_ENV === "development",
}: Props) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        {showDetails && error?.message ? (
          <pre className="mt-4 max-h-24 overflow-auto rounded-md border border-destructive/20 bg-destructive/5 p-2 text-left text-xs text-destructive">
            {error.message}
          </pre>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {reset ? (
            <Button type="button" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryLabel}
            </Button>
          ) : null}
          <Link href={homeHref}>
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              {homeLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
