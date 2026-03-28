import { Globe2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Header mark: globe tile + gradient wordmark (global brand feel).
 */
export function SiteLogo() {
  return (
    <Link
      href="/"
      className="group inline-flex shrink-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label="XtheX home"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#10B981] text-white shadow-md shadow-[#2563EB]/30 ring-1 ring-white/25 transition-transform duration-200 group-hover:scale-[1.03]">
        <Globe2 className="h-[1.15rem] w-[1.15rem]" aria-hidden />
      </span>
      <span className="text-base font-bold tracking-tight sm:text-lg">
        <span className="bg-gradient-to-r from-[#2563EB] via-[#1d4ed8] to-[#10B981] bg-clip-text text-transparent dark:from-blue-400 dark:via-blue-300 dark:to-emerald-400">
          XtheX
        </span>
      </span>
    </Link>
  );
}
