"use client";

import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors";
  const styles =
    variant === "outline"
      ? "border-zinc-200 bg-white text-zinc-700"
      : "border-transparent bg-zinc-900 text-zinc-50";

  return <span className={`${base} ${styles} ${className}`} {...props} />;
}

