"use client";

import { cn } from "@/lib/utils";

const panel =
  "rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-md ring-1 ring-zinc-200/80 dark:border-zinc-200 dark:bg-white dark:text-zinc-900";

export function AdminAiUploadGatePage({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-100 to-zinc-50 p-6 text-zinc-900 dark:from-zinc-100 dark:to-zinc-50 dark:text-zinc-900">
      <div className={cn("mx-auto max-w-5xl", panel)}>
        <p className="text-zinc-600">{message}</p>
      </div>
    </div>
  );
}
