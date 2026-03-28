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
    <div
      role="alert"
      aria-live="assertive"
      className="flex min-h-[60vh] items-center justify-center px-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 animate-pulse text-destructive" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>

        {showDetails && error?.message ? (
          <pre className="mt-5 max-h-28 overflow-auto rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left text-xs leading-relaxed text-destructive">
            {error.message}
          </pre>
        ) : null}

        {error?.digest && !showDetails ? (
          <p className="mt-4 text-xs text-muted-foreground/60">
            오류 코드: <code className="font-mono">{error.digest}</code>
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {reset ? (
            <Button
              type="button"
              size="lg"
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              onClick={reset}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryLabel}
            </Button>
          ) : null}
          <Link href={homeHref}>
            <Button variant="outline" size="lg">
              <Home className="mr-2 h-4 w-4" />
              {homeLabel}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
