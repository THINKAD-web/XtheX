"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-screen items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          문제가 발생했습니다
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          잠시 후 다시 시도해 주세요.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={reset}>다시 시도</Button>
          <Link href="/">
            <Button variant="outline">홈으로</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

