"use client";

import * as React from "react";
import { HomeRoleCtas } from "@/components/home/home-role-ctas";
import { Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { landing } from "@/lib/landing-theme";
import { useLocalDaypart } from "@/hooks/use-local-daypart";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

const FLOAT_ICONS = [
  { top: "12%", left: "8%", size: 24, opacity: 0.4 },
  { top: "18%", right: "15%", size: 20, opacity: 0.35 },
  { top: "45%", left: "12%", size: 28, opacity: 0.3 },
  { top: "70%", left: "20%", size: 22, opacity: 0.4 },
  { top: "25%", right: "25%", size: 18, opacity: 0.35 },
  { top: "60%", right: "10%", size: 26, opacity: 0.3 },
  { top: "80%", right: "22%", size: 20, opacity: 0.4 },
  { top: "35%", left: "5%", size: 16, opacity: 0.35 },
] as const;

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
          ? "bg-gradient-to-b from-sky-50 via-white to-zinc-50 text-zinc-900"
          : "bg-zinc-950 text-white",
      )}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: isDay
            ? `
            linear-gradient(to bottom, rgba(59,130,246,0.06) 0%, transparent 45%, rgba(59,130,246,0.04) 100%),
            linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px),
            linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px)
          `
            : `
            linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 50%, rgba(0,0,0,0.3) 100%),
            linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px),
            linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px, 60px 60px, 60px 60px",
        }}
      />
      <div className="pointer-events-none absolute inset-0">
        {FLOAT_ICONS.map((pos, i) => (
          <div
            key={i}
            className={cn(
              "absolute",
              isDay ? "text-blue-500/50" : "text-blue-400/60",
            )}
            style={{
              top: pos.top,
              left: "left" in pos ? pos.left : undefined,
              right: "right" in pos ? pos.right : undefined,
              width: pos.size,
              height: pos.size,
              opacity: pos.opacity,
            }}
          >
            <Monitor className="h-full w-full" />
          </div>
        ))}
      </div>

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
            "text-balance text-4xl font-bold tracking-tight lg:text-5xl",
            isDay ? "text-zinc-900" : landing.h1OnDark,
          )}
        >
          {t("title")}
        </h1>
        <p
          className={cn(
            "mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed lg:text-xl lg:leading-relaxed",
            isDay ? "text-zinc-600" : "text-zinc-300",
          )}
        >
          {t("subtitle")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          {/*
            HomeRoleCtas는 내부에서 loading / 인증 / 비로그인을 모두 처리합니다.
            동일 트리 위치에 인스턴스를 하나만 두어 React 훅 순서 경고를 방지합니다.
          */}
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
