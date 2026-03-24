"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  disabled?: boolean;
  briefLabel: string;
  briefPlaceholder: string;
  creativeLabel: string;
  creativeHint: string;
  submitLabel: string;
  className?: string;
  onSubmit: (brief: string, file: File | null) => void;
};

export function RecommendForm({
  disabled,
  briefLabel,
  briefPlaceholder,
  creativeLabel,
  creativeHint,
  submitLabel,
  className,
  onSubmit,
}: Props) {
  const [brief, setBrief] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(brief, file);
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <Label htmlFor="recommend-brief" className="text-base font-medium">
          {briefLabel}
        </Label>
        <textarea
          id="recommend-brief"
          name="brief"
          required
          minLength={8}
          rows={8}
          disabled={disabled}
          placeholder={briefPlaceholder}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          className={cn(
            "min-h-[200px] w-full resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm",
            "ring-offset-background placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recommend-creative" className="text-base font-medium">
          {creativeLabel}
        </Label>
        <p className="text-sm text-muted-foreground">{creativeHint}</p>
        <input
          id="recommend-creative"
          name="creative"
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className={cn(
            "block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0",
            "file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white",
            "hover:file:bg-blue-600/90",
          )}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={disabled}
        className="h-12 w-full bg-blue-600 text-base hover:bg-blue-600/90 sm:w-auto sm:min-w-[200px]"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
