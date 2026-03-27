"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Building2, Monitor, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [selectedRole, setSelectedRole] = React.useState<
    "ADVERTISER" | "MEDIA_OWNER" | null
  >(null);

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
          >
            <button
              type="button"
              onClick={() => setSelectedRole("ADVERTISER")}
              disabled={loading !== null}
              className={cn(
                "w-full cursor-pointer rounded-xl border-2 p-6 text-center transition-all hover:border-blue-400",
                selectedRole === "ADVERTISER"
                  ? "border-blue-500 ring-2 ring-blue-500"
                  : "border-zinc-200 dark:border-zinc-700",
              )}
            >
              <Building2 className="mx-auto h-10 w-10 text-blue-600 dark:text-blue-400" />
              <h3 className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                광고주 / Advertiser
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                AI 미디어 믹스 제안으로 캠페인을 빠르게 실행하세요
              </p>
            </button>
          </motion.div>

          <motion.div
            custom={1}
            variants={reduceMotion ? undefined : cardVariants}
            initial={reduceMotion ? undefined : "hidden"}
            animate={reduceMotion ? undefined : "show"}
          >
            <button
              type="button"
              onClick={() => setSelectedRole("MEDIA_OWNER")}
              disabled={loading !== null}
              className={cn(
                "w-full cursor-pointer rounded-xl border-2 p-6 text-center transition-all hover:border-blue-400",
                selectedRole === "MEDIA_OWNER"
                  ? "border-blue-500 ring-2 ring-blue-500"
                  : "border-zinc-200 dark:border-zinc-700",
              )}
            >
              <Monitor className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              <h3 className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                매체사 / Media Owner
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                보유 매체를 등록하고 안정적인 광고 수익을 시작하세요
              </p>
            </button>
          </motion.div>
        </div>

        {selectedRole && (
          <motion.div
            className="mt-6 flex justify-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              type="button"
              className="h-12 px-8 text-base font-semibold bg-blue-600 hover:bg-blue-700"
              disabled={loading !== null}
              onClick={() => choose(selectedRole)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  처리 중...
                </span>
              ) : (
                "시작하기"
              )}
            </Button>
          </motion.div>
        )}

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
