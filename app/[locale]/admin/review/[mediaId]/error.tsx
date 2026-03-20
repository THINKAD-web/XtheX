"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "ko";
  return (
    <div className="min-h-screen bg-black p-6 text-zinc-100">
      <div className="mx-auto max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6">
        <h1 className="text-lg font-semibold text-white">검토 페이지 오류</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {error.message || "일시적인 오류가 발생했습니다."}
        </p>
        <div className="mt-4 flex gap-3">
          <Button
            type="button"
            onClick={reset}
            className="bg-orange-600 text-white hover:bg-orange-500"
          >
            다시 시도
          </Button>
          <Link
            href={`/${locale}/admin/medias`}
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-600 bg-transparent px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
          >
            미디어 목록
          </Link>
        </div>
      </div>
    </div>
  );
}
