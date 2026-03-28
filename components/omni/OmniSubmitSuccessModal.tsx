"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { CheckCircle2, Copy, LayoutDashboard, Sparkles } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";

const CYAN = ["#06b6d4", "#22d3ee", "#3b82f6", "#67e8f9", "#a5f3fc"];

function startConfetti(): () => void {
  const z = 280;
  confetti({
    particleCount: 100,
    spread: 80,
    origin: { y: 0.32, x: 0.5 },
    colors: CYAN,
    zIndex: z,
    ticks: 280,
    gravity: 1.05,
    scalar: 1.05,
  });
  const iv = window.setInterval(() => {
    confetti({
      particleCount: 5,
      angle: 55,
      spread: 48,
      origin: { x: 0, y: 0.65 },
      colors: CYAN,
      zIndex: z,
      ticks: 120,
    });
    confetti({
      particleCount: 5,
      angle: 125,
      spread: 48,
      origin: { x: 1, y: 0.65 },
      colors: CYAN,
      zIndex: z,
      ticks: 120,
    });
  }, 180);
  const stop = window.setTimeout(() => window.clearInterval(iv), 2400);
  return () => {
    window.clearInterval(iv);
    window.clearTimeout(stop);
  };
}

export function OmniSubmitSuccessModal({
  open,
  campaignId,
  onClose,
}: {
  open: boolean;
  campaignId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const params = useParams();
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) {
      firedRef.current = false;
      return;
    }
    if (!campaignId || firedRef.current) return;
    firedRef.current = true;
    let cleanup: (() => void) | undefined;
    const raf = requestAnimationFrame(() => {
      cleanup = startConfetti();
    });
    return () => {
      cancelAnimationFrame(raf);
      cleanup?.();
    };
  }, [open, campaignId]);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !campaignId) return null;

  const locale = params?.locale as string | undefined;
  const campaignPath =
    locale && locale !== "ko" ? `/${locale}/campaign/${campaignId}` : `/campaign/${campaignId}`;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${campaignPath}`
      : campaignPath;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      sonnerToast.success("캠페인 링크가 복사되었습니다");
    } catch {
      sonnerToast.error("복사에 실패했습니다");
    }
  };

  const goDashboard = () => {
    onClose();
    router.push("/dashboard/campaigns");
  };

  const goNewCampaign = () => {
    onClose();
    if (typeof window !== "undefined") {
      const loc = locale && locale !== "ko" ? `/${locale}` : "";
      window.location.href = `${window.location.origin}${loc}/#media-mix-ai`;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[280] flex items-center justify-center bg-zinc-950/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="omni-success-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-cyan-500/35 bg-zinc-950 shadow-2xl shadow-cyan-950/50",
          "bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-transparent"
          aria-hidden
        />
        <div className="relative px-6 pb-8 pt-10 sm:px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-cyan-500/40">
            <CheckCircle2 className="h-9 w-9 text-white" aria-hidden />
          </div>
          <h2
            id="omni-success-title"
            className="mt-6 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl"
          >
            옴니채널 캠페인 제출 완료!
          </h2>
          <p className="mt-4 text-center text-base leading-relaxed text-zinc-300">
            매체사 검토 중입니다{" "}
            <span className="whitespace-nowrap text-cyan-300">
              (평균 2~3일 소요)
            </span>
          </p>
          <div className="mt-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-gradient-to-r from-blue-600/25 to-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-200">
              <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden />
              현재 상태: 협의 대기
            </span>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <button
              type="button"
              onClick={goDashboard}
              className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-blue-500 hover:to-cyan-400 sm:min-w-[160px] sm:flex-none"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              대시보드 보기
            </button>
            <button
              type="button"
              onClick={goNewCampaign}
              className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 sm:min-w-[160px] sm:flex-none"
            >
              새로운 캠페인 만들기
            </button>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-800/80 px-5 text-sm font-medium text-zinc-100 transition hover:border-cyan-500/40 hover:bg-zinc-800 sm:min-w-[160px] sm:flex-none"
            >
              <Copy className="h-4 w-4 text-cyan-400" aria-hidden />
              링크 공유
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
