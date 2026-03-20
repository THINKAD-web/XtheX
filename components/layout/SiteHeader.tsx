import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Show } from "@/components/auth/show";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/**
 * 홈·탐색 등과 동일한 상단 헤더 (고정, h-14).
 */
export async function SiteHeader() {
  const tNav = await getTranslations("nav");
  const tExplore = await getTranslations("explore");
  const tFooter = await getTranslations("home.footer");

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          XtheX
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm sm:flex sm:gap-4">
          <Link
            href="/"
            className="whitespace-nowrap text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {tNav("home")}
          </Link>
          <Link
            href="/explore"
            className="whitespace-nowrap text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {tExplore("title")}
          </Link>
          <Link
            href="/about"
            className="whitespace-nowrap text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {tNav("about")}
          </Link>
          <Link
            href="/contact"
            className="whitespace-nowrap text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {tFooter("contact")}
          </Link>
          <Link
            href="/terms"
            className="whitespace-nowrap text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {tFooter("terms")}
          </Link>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="hidden text-zinc-700 sm:inline-flex dark:text-zinc-200">
                {tNav("sign_in")}
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">
                {tNav("sign_up")}
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
