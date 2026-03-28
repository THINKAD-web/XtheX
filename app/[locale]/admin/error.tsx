"use client";

import * as React from "react";
import { ErrorBoundaryUI } from "@/components/ui/error-boundary-ui";

const isDatabaseUrlMissing = (msg: string) =>
  /Missing DATABASE_URL|DATABASE_URL/.test(msg);

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showDbSetup = isDatabaseUrlMissing(error.message || "");

  if (showDbSetup) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-xl font-semibold">Database not configured</h1>
          <div className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            <p>
              Add{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">
                DATABASE_URL
              </code>{" "}
              to{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">
                .env.local
              </code>{" "}
              in the project root.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundaryUI
      title="관리자 페이지 오류"
      description="페이지를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
      error={error}
      reset={reset}
      homeHref="/admin"
      homeLabel="관리자 홈"
    />
  );
}
