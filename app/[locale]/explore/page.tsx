import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Show } from "@/components/auth/show";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { ExploreClient } from "@/components/explore/explore-client";
import { landing } from "@/lib/landing-theme";

async function Navbar() {
  const t = await getTranslations("nav");
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className={`flex h-14 items-center justify-between ${landing.container}`}>
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          XtheX
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-100 dark:hover:text-white">
                {t("sign_in")}
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white">
                {t("sign_up")}
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

export default async function ExplorePage() {
  return (
    <>
      <Navbar />
      <div className="pt-14">
        <ExploreClient />
      </div>
    </>
  );
}

