"use client";

import * as React from "react";
import { HomeRoleCtas } from "@/components/home/home-role-ctas";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { landing } from "@/lib/landing-theme";
import { useLocalDaypart } from "@/hooks/use-local-daypart";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export function HomeHeroDaypart() {
  const t = useTranslations("home.hero");
  const { status, data: session } = useSession();
  const part = useLocalDaypart();
  const isDay = part === "day";

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "";

  const authed = status === "authenticated";
  const loading = status === "loading";

  return (
    <section
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-28 pt-32 sm:pb-32 sm:pt-36 lg:pb-36 lg:pt-40",
        isDay
          ? "text-zinc-900"
          : "text-white",
      )}
    >
      {/* Background Image */}
      <Image
        src="/images/hero-billboard.jpg"
        alt="Times Square Billboard"
        fill
        className="object-cover"
        priority
        quality={80}
      />
      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 z-[1]",
          isDay
            ? "bg-gradient-to-b from-white/80 via-white/60 to-white/90"
            : "bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/90",
        )}
      />

      <div
        className={cn(
          "relative z-10 mx-auto max-w-4xl px-4 text-center transition-all duration-500",
          !loading && "animate-in fade-in-0 slide-in-from-bottom-3 duration-500",
        )}
      >
        {authed && displayName ? (
          <p
            className={cn(
              "mb-4 text-lg font-semibold tracking-tight sm:text-xl",
              isDay ? "text-blue-700" : "text-blue-300",
            )}
          >
            {t("greeting", { name: displayName })}
          </p>
        ) : null}

        <h1
          className={cn(
            "text-balance text-4xl font-bold tracking-tight lg:text-6xl drop-shadow-lg",
            isDay ? "text-zinc-900" : "text-white",
          )}
        >
          {t("title")}
        </h1>
        <p
          className={cn(
            "mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed lg:text-xl lg:leading-relaxed drop-shadow-md",
            isDay ? "text-zinc-700" : "text-zinc-200",
          )}
        >
          {t("subtitle")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          <HomeRoleCtas
            mediaLabel={t("cta_partner")}
            advertiserLabel={t("cta_explore")}
            mediaClassName={landing.btnPrimary}
            advertiserClassName={cn(
              "inline-flex h-11 min-w-[200px] items-center justify-center rounded-lg border px-6 text-sm font-medium transition-colors duration-200",
              isDay
                ? "border-zinc-300 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50"
                : "min-w-[200px] border-zinc-500 text-white hover:bg-white/10 dark:border-zinc-500",
            )}
          />

          {!loading && !authed ? (
            <>
              <Link
                href="/login"
                className="inline-flex h-12 min-w-[240px] items-center justify-center rounded-md bg-gradient-to-r from-blue-600 to-cyan-500 px-8 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-cyan-600 hover:shadow-xl"
              >
                {t("login_full_ai")}
              </Link>

              <Link
                href="/login"
                className={cn(
                  "text-sm underline-offset-4 transition-colors duration-200 hover:underline",
                  isDay
                    ? "text-zinc-600 hover:text-zinc-900"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                {t("has_account_login")}
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
