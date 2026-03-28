import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShieldCheck, Lock, CreditCard, Globe } from "lucide-react";

export async function SiteFooter() {
  const t = await getTranslations("home.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl px-4">
        {/* Security badges */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-700">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
            <span>SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <CreditCard className="h-3.5 w-3.5 text-violet-500" />
            <span>PCI DSS Secure</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Globe className="h-3.5 w-3.5 text-orange-500" />
            <span>GDPR Ready</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("copyright", { year })}
          </p>
          <nav aria-label="Footer navigation" className="flex gap-6 text-sm">
            <Link
              href="/about"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {t("about")}
            </Link>
            <Link
              href="/contact"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {t("contact")}
            </Link>
            <Link
              href="/terms"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {t("terms")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}


