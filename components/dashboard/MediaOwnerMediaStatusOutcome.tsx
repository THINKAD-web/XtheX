"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { hasOwnerSubmittedForReview } from "@/lib/media/owner-review-submission";
import { parseRejectionFromAdminMemo } from "@/lib/media/admin-memo-rejection";

type Props = {
  status: MediaStatus;
  parseHistory: Prisma.JsonValue | null;
  adminMemo: string | null;
  mediaName: string;
};

export function MediaOwnerMediaStatusOutcome({
  status,
  parseHistory,
  adminMemo,
  mediaName,
}: Props) {
  const [reasonOpen, setReasonOpen] = React.useState(false);
  const { reasonText, hasRejectedRecord } = parseRejectionFromAdminMemo(adminMemo);

  if (status === "PENDING") {
    const submitted = hasOwnerSubmittedForReview(parseHistory);
    return (
      <div className="flex max-w-[240px] flex-col gap-1.5">
        <Badge
          className={cn(
            "w-fit border-amber-500/55 bg-amber-500/20 font-semibold text-amber-950 shadow-sm dark:border-amber-400/45 dark:bg-amber-500/15 dark:text-amber-100",
          )}
        >
          승인 대기 중
        </Badge>
        <p
          className={cn(
            "text-[11px] font-medium leading-snug",
            submitted
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-amber-800/90 dark:text-amber-200/90",
          )}
        >
          {submitted
            ? "관리자 검토 중 — 곧 결과를 안내드릴게요."
            : "최종 신청 전 — 검토·수정 후 신청을 완료해 주세요."}
        </p>
      </div>
    );
  }

  if (status === "PUBLISHED") {
    return (
      <div className="flex max-w-[260px] flex-col gap-1.5">
        <Badge className="w-fit border-emerald-500/60 bg-emerald-500/15 font-semibold text-emerald-900 dark:border-emerald-400/50 dark:bg-emerald-950/40 dark:text-emerald-100">
          승인 완료
        </Badge>
        <p className="text-[11px] font-medium leading-snug text-emerald-800 dark:text-emerald-300/90">
          광고주 추천과 미디어 탐색에 노출 중입니다. 공개 페이지에서 노출 형태를 확인할 수 있어요.
        </p>
      </div>
    );
  }

  if (status === "REJECTED") {
    const preview =
      reasonText && reasonText.length > 42 ? `${reasonText.slice(0, 42)}…` : reasonText;

    return (
      <>
        <div className="flex max-w-[260px] flex-col gap-1.5">
          <Badge className="w-fit border-rose-500/60 bg-rose-500/15 font-semibold text-rose-900 dark:border-rose-400/50 dark:bg-rose-950/35 dark:text-rose-100">
            반려
          </Badge>
          <p className="text-[11px] font-medium leading-snug text-rose-900/95 dark:text-rose-200/90">
            반려되었습니다. 사유를 확인하고 수정한 뒤 다시 검토를 요청해 주세요.
          </p>
          {hasRejectedRecord ? (
            <div className="flex flex-col gap-1">
              {reasonText ? (
                <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">사유 요약:</span>{" "}
                  {preview}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
                  별도 사유 문구는 남지 않았어요. 필요하면 고객 지원으로 문의해 주세요.
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-fit border-rose-300/70 text-xs text-rose-800 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:hover:bg-rose-950/40"
                onClick={() => setReasonOpen(true)}
              >
                반려 사유 전체 보기
              </Button>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
              상세 사유는 관리자 메모에 없을 수 있어요. 수정 후 재신청해 주세요.
            </p>
          )}
        </div>

        {reasonOpen ? (
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-reason-title"
          >
            <div className="max-h-[min(80vh,520px)] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-3">
                <h3
                  id="reject-reason-title"
                  className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  반려 사유
                </h3>
                <button
                  type="button"
                  className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  onClick={() => setReasonOpen(false)}
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{mediaName}</p>
              <div className="mt-4 rounded-lg border border-rose-200/80 bg-rose-50/60 p-3 text-sm leading-relaxed text-zinc-800 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-zinc-200">
                {reasonText ? (
                  reasonText
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    관리자가 별도 사유를 적지 않았습니다. 내용을 보완한 뒤 다시 신청해 주세요.
                  </span>
                )}
              </div>
              <Button type="button" className="mt-4 w-full" onClick={() => setReasonOpen(false)}>
                확인
              </Button>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex rounded-full border border-zinc-300/80 bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
      )}
    >
      {status}
    </span>
  );
}
