"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, ArrowRight, Zap, MapPin, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const bullets = [
  { icon: Zap, text: "목표·예산·지역에 맞춘 AI 미디어 믹스 제안" },
  { icon: MapPin, text: "지도에서 입지·단가·조건을 한 화면에서 비교" },
  { icon: MessageCircle, text: "탐색부터 문의·계약까지 이어지는 실행 플로우" },
] as const;

export type AdvertiserRoleCardProps = {
  loading: boolean;
  anyLoading: boolean;
  onChoose: () => void;
  /** Parent passes `useReducedMotion()` so behavior matches the page. */
  reduceMotion?: boolean;
  className?: string;
};

/**
 * 온보딩 역할 선택 — 광고주 카드만 강화된 UI/카피.
 * Tailwind + shadcn Card + Framer Motion (미세 호버/그라데이션).
 */
export function AdvertiserRoleCard({
  loading,
  anyLoading,
  onChoose,
  reduceMotion: reduceMotionProp,
  className,
}: AdvertiserRoleCardProps) {
  const reducedFromHook = useReducedMotion();
  const reduceMotion = reduceMotionProp ?? reducedFromHook;

  return (
    <div
      className={cn(
        "group/adv relative h-full rounded-[1.125rem] p-[1px]",
        "bg-gradient-to-br from-sky-400/70 via-blue-500/55 to-violet-500/65",
        "shadow-[0_20px_50px_-20px_rgba(59,130,246,0.45)] transition-shadow duration-500",
        "hover:shadow-[0_28px_60px_-18px_rgba(99,102,241,0.55)] dark:shadow-[0_20px_50px_-20px_rgba(37,99,235,0.35)]",
        "dark:hover:shadow-[0_28px_60px_-18px_rgba(99,102,241,0.4)]",
        className,
      )}
    >
      {/* Hover: 살짝 밝아지는 글로우 */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[1.125rem] opacity-0 blur-xl transition-opacity duration-500 group-hover/adv:opacity-100"
        style={{
          background:
            "radial-gradient(120% 80% at 20% 0%, rgba(56,189,248,0.35), transparent 55%), radial-gradient(90% 70% at 90% 100%, rgba(139,92,246,0.35), transparent 50%)",
        }}
        aria-hidden
      />

      <Card
        className={cn(
          "relative h-full cursor-pointer overflow-hidden rounded-[1.05rem] border-0 bg-gradient-to-b from-white/98 to-blue-50/40",
          "dark:from-zinc-950 dark:to-blue-950/30",
          "transition-transform duration-300 ease-out will-change-transform",
          "group-hover/adv:-translate-y-0.5",
          reduceMotion && "group-hover/adv:translate-y-0",
        )}
        onClick={() => !anyLoading && onChoose()}
      >
        {/* 상단 메시 그라데이션 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-90 dark:opacity-80"
          aria-hidden
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.09) 0%, transparent 42%), linear-gradient(225deg, rgba(139,92,246,0.08) 0%, transparent 48%)",
          }}
        />

        {/* 호버 시 한 번 스쳐 지나가는 하이라이트 (모션 축소 시 비활성) */}
        {!reduceMotion && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.05rem] opacity-0 transition-opacity duration-300 group-hover/adv:opacity-100"
            aria-hidden
          >
            <div className="absolute -left-1/3 top-0 h-full w-1/2 -skew-x-12 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover/adv:translate-x-[280%] dark:via-white/12" />
          </div>
        )}

        <CardHeader className="relative space-y-3 pb-2 pt-6 text-left sm:space-y-4 sm:pt-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-blue-200/80 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200">
              광고주
            </span>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              캠페인 · 미디어 믹스 · OOH
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-balance text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              브리프만 입력하면,
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-sky-400 dark:via-blue-400 dark:to-violet-400">
                {" "}
                성과 중심 미디어 믹스
              </span>
              가 완성됩니다
            </h3>
            <p className="text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              예산·목표에 맞는 옥외/디지털 매체 조합을 AI가 제안합니다. 탐색,
              비교, 문의, 계약까지 한 흐름으로 빠르게 실행하세요.
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
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-blue-600 ring-1 ring-blue-500/20 dark:from-blue-500/20 dark:to-violet-500/20 dark:text-blue-300 dark:ring-blue-400/25">
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
                : { scale: 1.02, transition: { type: "spring" as const, stiffness: 450, damping: 22 } }
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
                "group/btn relative h-12 w-full overflow-hidden border-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600",
                "text-[15px] font-semibold text-white shadow-lg shadow-indigo-500/25",
                "transition-[box-shadow,filter,transform] duration-300 hover:brightness-110 hover:shadow-indigo-500/35",
                "dark:shadow-indigo-900/40",
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    맞춤 추천 받고 시작하기
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
            선택 후 광고주 맞춤 온보딩으로 이동합니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
