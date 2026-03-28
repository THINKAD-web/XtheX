import { cn } from "@/lib/utils";

type Props = {
  label: string;
  className?: string;
};

/** Non-interactive badge for E2E / encryption-complete UI (works in RSC). */
export function EncryptionBadge({ label, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-100",
        className,
      )}
      title={label}
    >
      <svg
        className="h-3 w-3 shrink-0 opacity-90"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      {label}
    </span>
  );
}
