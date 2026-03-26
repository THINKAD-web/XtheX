"use client";

import * as React from "react";
import { PenLine, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { MediaOwnerManualRegistrationForm } from "@/components/dashboard/media-owner-manual-registration-form";
import { MediaOwnerAiUploadForm } from "@/components/dashboard/media-owner-ai-upload-form";

type Mode = "choose" | "manual" | "ai";

type Props = {
  backLabel: string;
  backHref: string;
  title: string;
  subtitle: string;
};

export function MediaOwnerRegistrationHub({
  backLabel,
  backHref,
  title,
  subtitle,
}: Props) {
  const [mode, setMode] = React.useState<Mode>("choose");

  if (mode === "manual") {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setMode("choose")}
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" />
          등록 방식 다시 선택
        </button>
        <MediaOwnerManualRegistrationForm />
      </div>
    );
  }

  if (mode === "ai") {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setMode("choose")}
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" />
          등록 방식 다시 선택
        </button>
        <div className="rounded-2xl border border-emerald-500/25 bg-zinc-950 p-6 ring-1 ring-emerald-900/40">
          <h2 className="text-lg font-semibold text-white">AI 제안서 업로드</h2>
          <p className="mt-1 text-sm text-zinc-400">
            PDF/PPT 제안서를 올리면 필드가 자동 추출됩니다. 완료 후 검토 화면에서 수정하고 등록을 마무리하세요.
          </p>
          <div className="mt-6">
            <MediaOwnerAiUploadForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <Link
          href={backHref}
          className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← {backLabel}
        </Link>
        <h1 className="mt-4 text-balance text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={cn(
            "group relative flex h-full min-h-[220px] flex-col rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-8 text-left shadow-md transition-all",
            "hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-xl dark:border-blue-900/50 dark:from-blue-950/40 dark:via-zinc-950 dark:to-zinc-900 dark:hover:border-blue-600",
          )}
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <PenLine className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            직접 등록하기
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            매체명·위치·가격·사양·유동인구·효과 지표·이미지까지 직접 입력합니다. 제출 후{" "}
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              관리자 승인(PENDING)
            </span>
            을 거쳐 공개됩니다.
          </p>
          <span className="mt-4 text-sm font-semibold text-blue-700 group-hover:underline dark:text-blue-300">
            상세 폼 열기 →
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode("ai")}
          className={cn(
            "group relative flex h-full min-h-[220px] flex-col rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 text-left shadow-md transition-all",
            "hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-xl dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-zinc-900 dark:hover:border-emerald-600",
          )}
        >
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            AI 제안서 업로드로 등록하기
          </h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            제안서 PDF를 업로드하면 AI가 필드를 추출합니다. 이후 검토 화면에서 수정·확인 후 제출하면{" "}
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              승인 대기(PENDING)
            </span>
            상태로 접수됩니다.
          </p>
          <span className="mt-4 text-sm font-semibold text-emerald-800 group-hover:underline dark:text-emerald-300">
            업로드 시작 →
          </span>
        </button>
      </div>
    </div>
  );
}
