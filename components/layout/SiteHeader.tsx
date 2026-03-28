import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { OmniCartHeaderBtn } from "@/components/layout/OmniCartHeaderBtn";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { AuthNav } from "@/components/auth/auth-nav";
import { MobileNav } from "@/components/layout/MobileNav";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { landing } from "@/lib/landing-theme";
import { getLocale } from "next-intl/server";

export async function SiteHeader() {
  const locale = await getLocale();
  const tNav = await getTranslations("nav");
  const tExplore = await getTranslations("explore");
  const tFooter = await getTranslations("home.footer");

  const tNews = await getTranslations("news");
  const tBlog = await getTranslations("blog");

  const navItems = [
    { href: "/", label: tNav("home") },
    { href: "/explore", label: tExplore("title") },
    { href: "/campaign-planner", label: tNav("campaign_planner") },
    { href: "/news", label: tNews("title") },
    { href: "/blog", label: tBlog("nav_label") },
    { href: "/about", label: tNav("about") },
    { href: "/contact", label: tFooter("contact") },
    { href: "/terms", label: tFooter("terms") },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className={`grid h-14 grid-cols-[auto_1fr_auto] items-center gap-4 ${landing.container}`}>
        <div className="flex items-center gap-2 justify-self-start">
          <MobileNav items={navItems} />
          <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-foreground">
            XtheX
          </Link>
        </div>
        <nav className="hidden min-w-0 justify-self-center items-center gap-1 overflow-x-auto text-sm sm:flex sm:gap-5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="justify-self-end flex shrink-0 items-center gap-1.5 sm:gap-3">
          <NotificationCenter />
          <OmniCartHeaderBtn />
          <LanguageSwitcher />
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-3">
            <CurrencySwitcher locale={locale} label={tNav("currency")} />
          </div>
          <AuthNav
            signInLabel={tNav("sign_in")}
            signUpLabel={tNav("sign_up")}
          />
        </div>
      </div>
    </header>
  );
}
