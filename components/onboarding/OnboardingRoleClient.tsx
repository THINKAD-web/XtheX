"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { AdvertiserRoleCard } from "@/components/onboarding/AdvertiserRoleCard";
import { MediaOwnerRoleCard } from "@/components/onboarding/MediaOwnerRoleCard";
import { getLoginUrlForOnboardingRole } from "@/lib/onboarding/auth-entry";
import { useOnboardingRoleIntent } from "@/lib/onboarding/onboarding-role-intent-store";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 380, damping: 28 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 320,
      damping: 26,
      delay: 0.12 + i * 0.1,
    },
  }),
};

export function OnboardingRoleClient() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = React.useState<"adv" | "media" | null>(null);

  const choose = async (role: "ADVERTISER" | "MEDIA_OWNER") => {
    setLoading(role === "ADVERTISER" ? "adv" : "media");
    try {
      const res = await fetch("/api/onboarding/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) return;
      const flow = role === "ADVERTISER" ? "advertiser" : "media";
      router.push(`/onboarding/wizard?flow=${flow}`);
    } finally {
      setLoading(null);
    }
  };

  const springHover = reduceMotion
    ? undefined
    : {
        scale: 1.012,
        y: -2,
        transition: { type: "spring" as const, stiffness: 400, damping: 22 },
      };
  const springTap = reduceMotion ? undefined : { scale: 0.992 };

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <motion.div
        className="pointer-events-none absolute inset-x-0 -top-16 mx-auto h-44 w-[90%] max-w-5xl rounded-full bg-gradient-to-r from-blue-400/15 via-violet-400/10 to-emerald-400/15 blur-3xl"
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0.4, scale: 0.92 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/90 p-6 shadow-2xl ring-1 ring-black/[0.04] backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/85 dark:ring-white/[0.06] sm:p-8 lg:p-10"
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <motion.div
          className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-start sm:justify-between"
          variants={reduceMotion ? undefined : containerVariants}
          initial={reduceMotion ? undefined : "hidden"}
          animate={reduceMotion ? undefined : "show"}
        >
          <div className="space-y-3 text-left">
            <motion.div
              variants={reduceMotion ? undefined : itemVariants}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              XtheX 온보딩
            </motion.div>
            <motion.h1
              variants={reduceMotion ? undefined : itemVariants}
              className="text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl"
            >
              한 번의 선택으로, 광고 성과와 매체 수익을 더 빠르게
            </motion.h1>
            <motion.p
              variants={reduceMotion ? undefined : itemVariants}
              className="max-w-2xl text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base"
            >
              광고주인지 매체사인지 선택하면, 지금 필요한 기능부터 바로
              시작됩니다.
            </motion.p>
            <motion.p
              variants={reduceMotion ? undefined : itemVariants}
              className="inline-flex w-fit items-center rounded-full border border-zinc-200/80 bg-zinc-50/80 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700/80 dark:bg-zinc-800/70 dark:text-zinc-300"
            >
              10초 만에 역할 선택, 바로 실행 시작
            </motion.p>
          </div>
          <motion.div
            variants={reduceMotion ? undefined : itemVariants}
            className="shrink-0"
          >
            <Button
              type="button"
              className="h-10 bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-700"
              onClick={() => router.push("/dashboard/campaigns")}
            >
              옴니채널 카트
            </Button>
          </motion.div>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          <motion.div
            custom={0}
            variants={reduceMotion ? undefined : cardVariants}
            initial={reduceMotion ? undefined : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            whileHover={springHover}
            whileTap={springTap}
          >
            <AdvertiserRoleCard
              loading={loading === "adv"}
              anyLoading={
                loading !== null || status === "loading"
              }
              onChoose={() => choose("ADVERTISER")}
              reduceMotion={reduceMotion ?? undefined}
            />
          </motion.div>

          <motion.div
            custom={1}
            variants={reduceMotion ? undefined : cardVariants}
            initial={reduceMotion ? undefined : "hidden"}
            animate={reduceMotion ? undefined : "show"}
            whileHover={springHover}
            whileTap={springTap}
          >
            <MediaOwnerRoleCard
              loading={loading === "media"}
              anyLoading={
                loading !== null || status === "loading"
              }
              onChoose={() => choose("MEDIA_OWNER")}
              reduceMotion={reduceMotion ?? undefined}
            />
          </motion.div>
        </div>

        <motion.p
          className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400"
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.45, duration: 0.35 }}
        >
          역할은 언제든 설정에서 바꿀 수 있습니다.
        </motion.p>
      </motion.div>
    </div>
  );
}
