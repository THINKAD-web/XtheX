import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Contact — XtheX",
};

export default async function ContactPage() {
  const t = await getTranslations("nav");

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
          Contact
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          문의는 이메일 또는 관리자를 통해 연락 주세요. (데모 페이지)
        </p>
        <Link
          href="/explore"
          className="mt-6 inline-block text-orange-600 hover:underline"
        >
          ← {t("explore")}
        </Link>
      </main>
    </div>
  );
}
