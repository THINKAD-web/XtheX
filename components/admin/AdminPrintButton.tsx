"use client";

import { Printer } from "lucide-react";

export function AdminPrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
