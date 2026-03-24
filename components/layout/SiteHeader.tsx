import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AuthNav } from "@/components/auth/auth-nav";
import { landing } from "@/lib/landing-theme";

/**
 * 홈·탐색 등과 동일한 상단 헤더 (고정, h-14).
 */
export async function SiteHeader() {
  const tNav = await getTranslations("nav");
  const tExplore = await getTranslations("explore");
  const tFooter = await getTranslations("home.footer");

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className={`flex h-14 items-center gap-4 ${landing.container}`}>
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-foreground">
          XtheX
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm sm:flex sm:gap-4">
          <Link
            href="/"
            className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
          >
            {tNav("home")}
          </Link>
          <Link
            href="/explore"
            className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
          >
            {tExplore("title")}
          </Link>
          <Link
            href="/about"
            className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
          >
            {tNav("about")}
          </Link>
          <Link
            href="/contact"
            className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
          >
            {tFooter("contact")}
          </Link>
          <Link
            href="/terms"
            className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
          >
            {tFooter("terms")}
          </Link>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <AuthNav
            signInLabel={tNav("sign_in")}
            signUpLabel={tNav("sign_up")}
          />
        </div>
      </div>
    </header>
  );
}
