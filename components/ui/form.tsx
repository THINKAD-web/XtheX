import * as React from "react";

import { cn } from "@/lib/utils";

export function FormMessage({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <p className={cn("text-sm text-red-600", className)}>
      {children}
    </p>
  );
}

