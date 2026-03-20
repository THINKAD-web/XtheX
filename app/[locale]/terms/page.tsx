import type { Metadata } from "next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Terms — XtheX",
};

export default async function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
          >
            XtheX
          </Link>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          이용약관
        </h1>
        <p className="mt-4 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
          {`본 페이지는 데모용 안내입니다.\n실제 서비스 오픈 시 법무 검토된 약관으로 교체하세요.`}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-orange-600 hover:underline"
        >
          ← 홈
        </Link>
      </main>
    </div>
  );
}
