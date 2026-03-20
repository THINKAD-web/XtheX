"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AdminMemoInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function AdminMemoInput({
  value,
  onChange,
  placeholder = "AI 파싱 시 참고할 관리자 메모 (선택)",
  disabled,
  className,
}: AdminMemoInputProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-zinc-300">
        관리자 메모
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className={cn(
          "w-full resize-y rounded-lg border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500",
          "focus-visible:ring-orange-500 focus-visible:border-orange-500/50"
        )}
      />
    </div>
  );
}
