import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OmniCartHeaderBtn } from "@/components/layout/OmniCartHeaderBtn";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { AuthNav } from "@/components/auth/auth-nav";
import { MobileNav, type AppNavItem } from "@/components/layout/MobileNav";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete";
import { landing } from "@/lib/landing-theme";
import { getLocale } from "next-intl/server";

export async function SiteHeader() {
  const locale = await getLocale();
  const tNav = await getTranslations("nav");
  const tExplore = await getTranslations("explore");
  const tFooter = await getTranslations("home.footer");

  const tNews = await getTranslations("news");
  const tBlog = await getTranslations("blog");

  const navItems: AppNavItem[] = [
    { href: "/", label: tNav("home") },
    { href: "/explore", label: tExplore("title"), dataTour: "tour-explore" },
    { href: "/community", label: tNav("community") },
    { href: "/campaign-planner", label: tNav("campaign_planner"), dataTour: "tour-planner" },
    { href: "/templates", label: tNav("templates"), dataTour: "tour-templates" },
    { href: "/billing", label: tNav("billing") },
    { href: "/trends", label: tNav("trends") },
    { href: "/news", label: tNews("title") },
    { href: "/blog", label: tBlog("nav_label") },
    { href: "/about", label: tNav("about") },
    { href: "/contact", label: tFooter("contact") },
    { href: "/terms", label: tFooter("terms") },
  ];

  return (
    <header
      role="banner"
      aria-label="Site header"
      className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/85 shadow-sm shadow-zinc-900/[0.04] backdrop-blur-md dark:bg-background/90 dark:shadow-black/20"
    >
      <div className={`grid h-14 grid-cols-[auto_1fr_auto] items-center gap-4 ${landing.container}`}>
        <div className="flex items-center gap-2 justify-self-start">
          <MobileNav items={navItems} />
          <SiteLogo />
        </div>
        <nav aria-label="Main navigation" className="hidden min-w-0 justify-self-center items-center gap-1 overflow-x-auto text-sm sm:flex sm:gap-5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
              {...(item.dataTour ? { "data-tour": item.dataTour } : {})}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="justify-self-end flex shrink-0 items-center gap-1.5 sm:gap-3">
          <span data-tour="tour-search" className="hidden sm:inline">
            <SearchAutocomplete className="hidden sm:block" />
          </span>
          <NotificationCenter />
          <OmniCartHeaderBtn />
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-3">
            <CurrencySwitcher locale={locale} label={tNav("currency")} />
          </div>
          <span data-tour="tour-account" className="inline-flex items-center">
            <AuthNav signInLabel={tNav("sign_in")} signUpLabel={tNav("sign_up")} />
          </span>
        </div>
      </div>
    </header>
  );
}
