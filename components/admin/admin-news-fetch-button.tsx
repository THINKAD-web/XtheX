"use client";

import { useState } from "react";
import { Rss, Loader2, CheckCircle } from "lucide-react";

export function AdminNewsFetchButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleFetch() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/cron/fetch-news");
      const data = await res.json();
      setResult(
        data.ok
          ? `완료! ${data.saved}건 저장${data.errors?.length ? ` (오류 ${data.errors.length}건)` : ""}`
          : "실패",
      );
    } catch {
      setResult("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleFetch}
        disabled={loading}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rss className="h-4 w-4" />
        )}
        뉴스 수동 수집
      </button>
      {result && (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4 text-green-500" />
          {result}
        </span>
      )}
    </div>
  );
}
