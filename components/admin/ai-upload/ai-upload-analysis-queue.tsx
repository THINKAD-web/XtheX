"use client";

import * as React from "react";
import {
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadDraftPreview } from "@/lib/admin/upload-draft-preview";
import { InlineDraftEditor } from "@/components/admin/ai-upload/inline-draft-editor";

const CATEGORY_KO: Record<string, string> = {
  BILLBOARD: "빌보드",
  DIGITAL_BOARD: "디지털 보드",
  TRANSIT: "대중교통",
  STREET_FURNITURE: "가로 시설물",
  WALL: "월/벽면",
  ETC: "기타",
};

export type AnalysisQueueRow = {
  id: string;
  file: File;
  phase: "waiting" | "analyzing" | "done" | "error";
  progress: number;
  draftId?: string;
  preview?: UploadDraftPreview;
  error?: string;
  detailOpen: boolean;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function categoryLabel(cat: string): string {
  return CATEGORY_KO[cat] ?? cat;
}

type AiUploadAnalysisQueueProps = {
  items: AnalysisQueueRow[];
  locale: string;
  anyAnalyzing: boolean;
  onToggleDetail: (rowId: string) => void;
  onOpenDetail: (rowId: string) => void;
};

export function AiUploadAnalysisQueue({
  items,
  locale,
  anyAnalyzing,
  onToggleDetail,
  onOpenDetail,
}: AiUploadAnalysisQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">파일 목록 ({items.length})</h3>
        {anyAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            처리 중...
          </div>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-xl">
            <div
              className={cn(
                "relative overflow-hidden rounded-xl border transition-colors",
                item.phase === "analyzing" && "border-blue-200 bg-blue-50/80 dark:border-blue-500/35 dark:bg-blue-950/30",
                item.phase === "waiting" && "border-border bg-muted/30",
                item.phase === "done" &&
                  "border-amber-200 bg-amber-50/60 shadow-sm dark:border-amber-500/35 dark:bg-amber-950/25",
                item.phase === "error" && "border-destructive/30 bg-destructive/5 dark:bg-destructive/10",
              )}
            >
              <div className="flex items-start gap-3 p-3 pr-2">
                <div className="mt-0.5 shrink-0">
                  {item.phase === "analyzing" ? (
                    <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" aria-hidden />
                  ) : item.phase === "done" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                      <Check className="h-4 w-4" />
                    </div>
                  ) : item.phase === "error" ? (
                    <XCircle className="h-8 w-8 text-destructive" aria-hidden />
                  ) : (
                    <FileText className="h-8 w-8 text-muted-foreground" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatSize(item.file.size)}
                    {item.phase === "waiting" && <span className="ml-2">· 대기 중</span>}
                    {item.phase === "analyzing" && (
                      <span className="ml-2 font-medium text-blue-600 dark:text-blue-400">· AI 분석 중...</span>
                    )}
                    {item.phase === "done" && item.preview && (
                      <>
                        <span className="ml-2 font-medium text-amber-700 dark:text-amber-400">· 검토 대기 중</span>
                        {item.preview.trustScore != null && (
                          <span className="ml-2 text-muted-foreground">AI 신뢰도: {item.preview.trustScore}%</span>
                        )}
                      </>
                    )}
                    {item.phase === "error" && item.error && (
                      <span className="ml-2 text-destructive">
                        · {item.error.slice(0, 120)}
                        {item.error.length > 120 ? "…" : ""}
                      </span>
                    )}
                  </p>
                  {item.phase === "done" && item.preview && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.preview.mediaName} · {categoryLabel(item.preview.category)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {item.phase === "done" && item.preview && (
                    <>
                      <Button type="button" size="sm" className="h-8 gap-1" onClick={() => onOpenDetail(item.id)}>
                        <Check className="h-3.5 w-3.5" />
                        추출 데이터 확인·수정
                      </Button>
                      <button
                        type="button"
                        onClick={() => onToggleDetail(item.id)}
                        className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
                        aria-expanded={item.detailOpen}
                      >
                        {item.detailOpen ? (
                          <>
                            접기 <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            펼쳐서 수정 <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {item.phase === "analyzing" && (
                <div className="px-3 pb-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out dark:bg-blue-500"
                      style={{
                        width: `${Math.max(8, Math.min(item.progress, 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {item.phase === "done" && item.preview && item.detailOpen && (
              <div className="mt-2 rounded-xl border border-border bg-muted/20 p-4 text-sm shadow-inner dark:bg-card/50">
                <InlineDraftEditor
                  draftId={item.preview.draftId}
                  locale={locale}
                  onClose={() => onToggleDetail(item.id)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
