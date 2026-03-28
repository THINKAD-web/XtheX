"use client";

import * as React from "react";
import { HomeRoleCtas } from "@/components/home/home-role-ctas";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { landing } from "@/lib/landing-theme";
import { useLocalDaypart } from "@/hooks/use-local-daypart";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

const SPOTS: Record<string, string[]> = {
  ko: ["타임스스퀘어", "시부야 교차로", "강남 대형 전광판", "상하이 루자쭈이"],
  en: ["Times Square", "Shibuya Crossing", "Gangnam LED", "Shanghai Lujiazui"],
  ja: ["タイムズスクエア", "渋谷スクランブル", "江南LED", "上海陸家嘴"],
  zh: ["时代广场", "涩谷十字路口", "江南LED广告", "上海陆家嘴"],
};

const SPOT_PREFIX: Record<string, string> = {
  ko: "지금 바로 ",
  en: "Right now at ",
  ja: "今すぐ ",
  zh: "现在就在 ",
};

export function HomeHeroDaypart() {
  const t = useTranslations("home.hero");
  const locale = useLocale();
  const { status, data: session } = useSession();
  const part = useLocalDaypart();
  const isDay = part === "day";

  const heroRef = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [spotIdx, setSpotIdx] = React.useState(0);
  const [fade, setFade] = React.useState(true);
  const spots = SPOTS[locale] ?? SPOTS.en;
  const prefix = SPOT_PREFIX[locale] ?? SPOT_PREFIX.en;

  React.useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setSpotIdx((prev) => (prev + 1) % spots.length);
        setFade(true);
      }, 500);
    }, 3000);
    return () => clearInterval(timer);
  }, [spots.length]);

  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "";

  const authed = status === "authenticated";
  const loading = status === "loading";

  return (
    <section
      ref={heroRef}
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-28 pt-32 sm:pb-32 sm:pt-36 lg:pb-36 lg:pt-40",
        "text-white",
      )}
    >
      {/* Animated gradient base */}
      <div className="animate-hero-gradient absolute inset-0" />
      {/* Background Image with parallax */}
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <Image
          src="/images/hero-billboard.jpg"
          alt="Times Square Billboard"
          fill
          className="object-cover opacity-60 scale-110"
          priority
          quality={80}
        />
      </motion.div>
      {/* Overlay */}
      <div
        className={cn(
          "absolute inset-0 z-[1]",
          isDay
            ? "bg-gradient-to-b from-black/30 via-black/20 to-black/50"
            : "bg-gradient-to-b from-zinc-950/60 via-zinc-950/40 to-zinc-950/70",
        )}
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className={cn(
          "relative z-10 mx-auto max-w-4xl px-4 text-center transition-all duration-500",
          !loading && "animate-in fade-in-0 slide-in-from-bottom-3 duration-500",
        )}
      >
        {authed && displayName ? (
          <p
            className="mb-4 text-lg font-semibold tracking-tight sm:text-xl text-blue-200"
          >
            {t("greeting", { name: displayName })}
          </p>
        ) : null}

        <h1
          className="text-balance text-4xl font-bold tracking-tight lg:text-6xl drop-shadow-lg text-white"
        >
          {t("title")}
        </h1>
        <p
          className={cn(
            "mt-2 text-xl font-bold transition-opacity duration-500 lg:text-2xl",
            fade ? "opacity-100" : "opacity-0",
          )}
        >
          <span className="text-zinc-300">{prefix}</span>
          <span className="text-cyan-300">{spots[spotIdx]}</span>
        </p>
        <p
          className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed lg:text-xl lg:leading-relaxed drop-shadow-md text-zinc-100"
        >
          {t("subtitle")}
        </p>

        <div className="mt-10 flex flex-col items-center gap-6">
          <HomeRoleCtas
            mediaLabel={t("cta_partner")}
            advertiserLabel={t("cta_explore")}
            mediaClassName={landing.btnPrimary}
            advertiserClassName="inline-flex h-11 min-w-[200px] items-center justify-center rounded-lg border border-zinc-400 bg-transparent px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/10"
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
                className="text-sm text-zinc-300 underline-offset-4 transition-colors hover:underline hover:text-white"
              >
                {t("has_account_login")}
              </Link>
            </>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
