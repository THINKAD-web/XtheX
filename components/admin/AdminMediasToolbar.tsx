"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocalDaypart } from "@/hooks/use-local-daypart";
import { cn } from "@/lib/utils";

export function AdminMediasToolbar({
  locale,
  createDemoMediasAction,
  labels,
}: {
  locale: string;
  createDemoMediasAction: () => Promise<void>;
  labels: { back: string; aiUpload: string; demoMedias: string };
}) {
  const isDay = useLocalDaypart() === "day";

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <Link
        href={`/${locale}/admin`}
        className={cn(
          "text-sm transition-colors",
          isDay
            ? "text-zinc-600 hover:text-orange-600"
            : "text-zinc-400 hover:text-orange-400",
        )}
      >
        {labels.back}
      </Link>
      <Link
        href={`/${locale}/admin/ai-upload`}
        className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-500"
      >
        {labels.aiUpload}
      </Link>
      <form action={createDemoMediasAction}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className={
            isDay
              ? "border-zinc-300 text-zinc-800 hover:bg-zinc-100"
              : "border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-white"
          }
        >
          {labels.demoMedias}
        </Button>
      </form>
    </div>
  );
}
