"use client";

export function ComparePrintButton({ locale }: { locale: string }) {
  const isKo = locale === "ko";
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground print:hidden"
    >
      🖨️ {isKo ? "인쇄" : "Print"}
    </button>
  );
}
