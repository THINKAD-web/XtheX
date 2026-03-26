"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ArrowRight,
  Building2,
  DollarSign,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

const bullets = [
  { icon: DollarSign, text: "빈 시간대를 수익으로 전환하는 광고 매칭" },
  { icon: UploadCloud, text: "제안서 업로드 한 번으로 빠른 매체 등록" },
  { icon: Building2, text: "옥외·디지털 사이니지를 한 곳에서 운영" },
] as const;

export type MediaOwnerRoleCardProps = {
  loading: boolean;
  anyLoading: boolean;
  onChoose: () => void;
  reduceMotion?: boolean;
  className?: string;
  ctaVariant?: "A" | "B";
};

const CTA_COPY = {
  A: "매체 등록하고 수익화 시작하기",
  B: "내 매체 광고 받기",
} as const;

export function MediaOwnerRoleCard({
  loading,
  anyLoading,
  onChoose,
  reduceMotion: reduceMotionProp,
  className,
  ctaVariant,
}: MediaOwnerRoleCardProps) {
  const reducedFromHook = useReducedMotion();
  const reduceMotion = reduceMotionProp ?? reducedFromHook;
  const [resolvedVariant, setResolvedVariant] = useState<"A" | "B">(
    ctaVariant ?? "A",
  );

  useEffect(() => {
    if (ctaVariant) {
      setResolvedVariant(ctaVariant);
      return;
    }
    const key = "xthex_media_owner_cta_variant";
    const saved = window.localStorage.getItem(key);
    if (saved === "A" || saved === "B") {
      setResolvedVariant(saved);
      return;
    }
    const selected = Math.random() < 0.5 ? "A" : "B";
    window.localStorage.setItem(key, selected);
    setResolvedVariant(selected);
  }, [ctaVariant]);

  return (
    <div
      className={cn(
        "group/media relative h-full rounded-[1.125rem] p-[1px]",
        "bg-gradient-to-br from-emerald-400/70 via-green-500/60 to-teal-500/65",
        "shadow-[0_20px_50px_-20px_rgba(16,185,129,0.45)] transition-shadow duration-500",
        "hover:shadow-[0_28px_60px_-18px_rgba(13,148,136,0.5)] dark:shadow-[0_20px_50px_-20px_rgba(5,150,105,0.35)]",
        "dark:hover:shadow-[0_28px_60px_-18px_rgba(20,184,166,0.4)]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-[1.125rem] opacity-0 blur-xl transition-opacity duration-500 group-hover/media:opacity-100"
        style={{
          background:
            "radial-gradient(120% 80% at 15% 0%, rgba(52,211,153,0.35), transparent 55%), radial-gradient(90% 70% at 90% 100%, rgba(20,184,166,0.35), transparent 50%)",
        }}
        aria-hidden
      />

      <Card
        className={cn(
          "relative h-full cursor-pointer overflow-hidden rounded-[1.05rem] border-0 bg-gradient-to-b from-white/98 to-emerald-50/45",
          "dark:from-zinc-950 dark:to-emerald-950/30",
          "transition-transform duration-300 ease-out will-change-transform",
          "group-hover/media:-translate-y-0.5",
          reduceMotion && "group-hover/media:translate-y-0",
        )}
        onClick={() => !anyLoading && onChoose()}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90 dark:opacity-80"
          aria-hidden
          style={{
            background:
              "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, transparent 42%), linear-gradient(225deg, rgba(20,184,166,0.08) 0%, transparent 48%)",
          }}
        />

        {!reduceMotion && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.05rem] opacity-0 transition-opacity duration-300 group-hover/media:opacity-100"
            aria-hidden
          >
            <div className="absolute -left-1/3 top-0 h-full w-1/2 -skew-x-12 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover/media:translate-x-[280%] dark:via-white/12" />
          </div>
        )}

        <CardHeader className="relative space-y-3 pb-2 pt-6 text-left sm:space-y-4 sm:pt-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200">
              매체사
            </span>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              간편 등록 · AI 보강 · 노출·문의
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-balance text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              보유 매체를 더 쉽게 등록하고,
              <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-green-400 dark:to-teal-400">
                {" "}
                안정적인 수익
              </span>
              으로 연결하세요
            </h3>
            <p className="text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              제안서 업로드만으로 등록 과정을 간소화하고, 광고주 매칭까지
              연결됩니다. 옥외광고와 디지털 사이니지 운영을 한곳에서 관리하세요.
            </p>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-5 pb-6 text-left sm:pb-7">
          <ul className="space-y-2.5">
            {bullets.map(({ icon: Icon, text }, i) => (
              <motion.li
                key={text}
                className="flex items-start gap-2.5 text-sm text-zinc-800 dark:text-zinc-200"
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                transition={{
                  type: "spring" as const,
                  stiffness: 400,
                  damping: 28,
                  delay: 0.05 * i,
                }}
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-emerald-600 ring-1 ring-emerald-500/20 dark:from-emerald-500/20 dark:to-teal-500/20 dark:text-emerald-300 dark:ring-emerald-400/25">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <span className="leading-snug">{text}</span>
              </motion.li>
            ))}
          </ul>

          <motion.div
            whileHover={
              reduceMotion
                ? undefined
                : {
                    scale: 1.02,
                    transition: {
                      type: "spring" as const,
                      stiffness: 450,
                      damping: 22,
                    },
                  }
            }
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            <Button
              type="button"
              disabled={anyLoading}
              onClick={(e) => {
                e.stopPropagation();
                onChoose();
              }}
              className={cn(
                "group/btn relative h-12 w-full overflow-hidden border-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600",
                "text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/25",
                "transition-[box-shadow,filter,transform] duration-300 hover:brightness-110 hover:shadow-emerald-500/35",
                "dark:shadow-emerald-900/40",
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {CTA_COPY[resolvedVariant]}
                    <ArrowRight
                      className={cn(
                        "h-4 w-4 transition-transform duration-300 ease-out",
                        !reduceMotion && "group-hover/btn:translate-x-0.5",
                      )}
                    />
                  </>
                )}
              </span>
              {!reduceMotion && (
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)",
                  }}
                  aria-hidden
                />
              )}
            </Button>
          </motion.div>

          <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-500">
            선택 후 매체사 맞춤 온보딩으로 이동합니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
