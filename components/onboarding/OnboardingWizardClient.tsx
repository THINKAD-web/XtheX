"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  FileText,
  MapPin,
} from "lucide-react";
import { PendingRoleAfterAuth } from "@/components/onboarding/PendingRoleAfterAuth";

const STEPS_ADV = 3;
const STEPS_MEDIA = 3;

export function OnboardingWizardClient({
  flow,
}: {
  flow: "advertiser" | "media";
}) {
  const router = useRouter();
  const isAdv = flow === "advertiser";
  const total = isAdv ? STEPS_ADV : STEPS_MEDIA;
  const [step, setStep] = React.useState(0);
  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const [finishing, setFinishing] = React.useState(false);

  const complete = async (href: string) => {
    setFinishing(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("온보딩 완료 처리에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("xthex_onboarding_ok", "1");
        if (dontShowAgain) {
          localStorage.setItem("xthex_skip_onboarding_hint", "1");
        }
      }
      router.replace(href);
    } finally {
      setFinishing(false);
    }
  };

  const stepper = (
    <div className="mb-8 flex justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`단계 ${i + 1}`}
          className={`h-2.5 rounded-full transition-all ${
            i === step
              ? "w-8 bg-zinc-900 dark:bg-zinc-100"
              : i < step
                ? "w-2.5 bg-zinc-400 dark:bg-zinc-500"
                : "w-2.5 bg-zinc-200 dark:bg-zinc-700"
          }`}
          onClick={() => setStep(i)}
        />
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PendingRoleAfterAuth />
      {stepper}

      <Card className="border-zinc-200 shadow-lg dark:border-zinc-700">
        <CardContent className="p-6 sm:p-8">
          {isAdv && step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-10 w-10 text-blue-500" />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  환영합니다, 광고주님
                </h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                XtheX는 AI 기반 미디어 믹스 추천으로 캠페인 브리프만 입력해도
                최적의 옥외광고 조합을 제안합니다. 예산·지역·타겟을 자연어로
                말해 보세요.
              </p>
              <ul className="list-inside list-disc text-sm text-zinc-600 dark:text-zinc-400">
                <li>전 세계 매체 데이터와 연동</li>
                <li>캠페인 저장 후 제출까지 한 흐름</li>
              </ul>
            </div>
          )}

          {isAdv && step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                미디어 믹스 검색 방법
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                메인 페이지 하단 검색창에 브리프를 입력하고 추천 받기를 누르면
                지도와 조합 카드로 결과를 확인할 수 있습니다.
              </p>
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-8 text-center dark:border-zinc-600 dark:from-blue-950/40 dark:via-zinc-900 dark:to-violet-950/30">
                <MapPin className="mx-auto h-14 w-14 text-blue-500/80" />
                <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  데모 영역
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  (실서비스에서는 GIF/스크린샷을 넣을 수 있습니다)
                </p>
              </div>
            </div>
          )}

          {isAdv && step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                첫 캠페인 만들기
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                메인으로 이동해 미디어 믹스 검색을 시작해 보세요. 마음에 드는
                조합은 저장할 수 있습니다.
              </p>
              <Link
                href="/#media-mix-ai"
                className="inline-flex w-full items-center justify-center rounded-md border border-zinc-200 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                메인에서 미디어 믹스 열기
              </Link>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                다시 보지 않기 (온보딩 건너뛰기)
              </label>
              <Button
                className="w-full"
                disabled={finishing}
                onClick={() => complete("/dashboard/advertiser")}
              >
                {finishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "완료하고 대시보드로"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={finishing}
                onClick={() => complete("/")}
              >
                완료하고 메인으로
              </Button>
            </div>
          )}

          {!isAdv && step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RadioTowerIcon />
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  환영합니다, 매체사님
                </h2>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                PDF 제안서를 업로드하면 AI가 매체 정보를 추출하고 검토 후
                노출됩니다. 등록된 매체는 광고주 검색·믹스 추천에 포함됩니다.
              </p>
            </div>
          )}

          {!isAdv && step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                PDF 제안서 업로드
              </h2>
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <FileText className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <ul className="space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <li>1. 업로드 페이지에서 PDF 파일 선택</li>
                  <li>2. AI가 위치·가격·노출 등을 파싱</li>
                  <li>3. 검토 승인 후 상세 페이지 공개</li>
                </ul>
              </div>
            </div>
          )}

          {!isAdv && step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                제안서 올리러 가기
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                아래 버튼으로 업로드 화면으로 이동할 수 있습니다.
              </p>
              <Link
                href="/upload"
                className="inline-flex w-full items-center justify-center rounded-md bg-emerald-700 py-3 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-emerald-600"
              >
                PDF 업로드 페이지로 이동
              </Link>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                다시 보지 않기
              </label>
              <Button
                className="w-full"
                variant="outline"
                disabled={finishing}
                onClick={() => complete("/dashboard/media-owner")}
              >
                {finishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "완료하고 파트너 대시보드로"
                )}
              </Button>
            </div>
          )}

          {step < total - 1 && (
            <div className="mt-8 flex justify-between border-t border-zinc-100 pt-6 dark:border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                이전
              </Button>
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                다음
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RadioTowerIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M4.9 19.1C3.8 18 3 16.5 3 15" />
        <path d="M7.7 16.3c-.8-.8-1.2-1.8-1.2-3" />
        <path d="M15.2 7.8a2.5 2.5 0 0 1 3.5 3.5" />
        <path d="M19.1 4.9C18 3 16.5 3 15 3" />
        <path d="M12 12v9" />
        <path d="M12 3v3" />
        <path d="M8 12H5" />
        <path d="M19 12h-3" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </div>
  );
}
