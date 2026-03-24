"use client";

import * as React from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type UploadButtonProps = {
  disabled?: boolean;
  hasFiles: boolean;
  onUpload: () => Promise<void>;
  className?: string;
};

export function UploadButton({
  disabled,
  hasFiles,
  onUpload,
  className,
}: UploadButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!isPending) {
      setProgress(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(95, Math.floor((elapsed / 800) * 50)));
    }, 100);
    return () => clearInterval(id);
  }, [isPending]);

  React.useEffect(() => {
    if (!isPending && progress > 0) setProgress(100);
  }, [isPending, progress]);

  const handleClick = () => {
    if (!hasFiles || disabled || isPending) return;
    startTransition(async () => {
      await onUpload();
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled || !hasFiles || isPending}
        className={cn(
          "w-full rounded-lg font-semibold shadow-sm",
          "bg-zinc-900 text-white hover:bg-zinc-800",
          "disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none disabled:opacity-100",
        )}
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            업로드 중…
          </span>
        ) : (
          "AI 추출 시작"
        )}
      </Button>
      {isPending && <Progress value={progress} className="h-1.5 bg-muted" />}
    </div>
  );
}
