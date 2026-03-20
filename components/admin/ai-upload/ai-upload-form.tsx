"use client";

import * as React from "react";
import { useToast } from "@/components/ui/use-toast";
import { UploadDropzone, type FileWithStatus } from "./upload-dropzone";
import { UploadButton } from "./upload-button";
import {
  AiUploadAnalysisQueue,
  type AnalysisQueueRow,
} from "./ai-upload-analysis-queue";

type AiUploadFormProps = {
  locale: string;
};

type ApiSuccess = {
  success: true;
  draftId: string;
  draftIds?: string[];
  previews?: Array<{
    draftId: string;
    mediaName: string;
    category: string;
    trustScore: number | null;
    description: string | null;
    tags: string[];
    address: string | null;
    district: string | null;
    price: number | null;
    cpm: number | null;
  }>;
  failed?: { name: string; error: string }[];
};

type ApiFail = { success: false; error: string };

export function AiUploadForm({ locale }: AiUploadFormProps) {
  const { toast } = useToast();
  const [files, setFiles] = React.useState<FileWithStatus[]>([]);
  const [queue, setQueue] = React.useState<AnalysisQueueRow[] | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const hasValidFile = files.some((f) => f.status === "ready");
  const anyAnalyzing =
    queue?.some((q) => q.phase === "analyzing") ?? false;

  const handleUpload = React.useCallback(async () => {
    const ready = files.filter((f) => f.status === "ready");
    if (!ready.length) return;

    const rows: AnalysisQueueRow[] = ready.map((f) => ({
      id: f.id,
      file: f.file,
      phase: "waiting" as const,
      progress: 0,
      detailOpen: false,
    }));

    setQueue(rows);
    setFiles((prev) => prev.filter((f) => f.status !== "ready"));
    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowId = rows[i].id;
      const file = rows[i].file;

      setQueue((prev) =>
        prev
          ? prev.map((item) =>
              item.id === rowId
                ? { ...item, phase: "analyzing", progress: 8 }
                : item,
            )
          : null,
      );

      const progressTimer = window.setInterval(() => {
        setQueue((prev) =>
          prev
            ? prev.map((item) =>
                item.id === rowId && item.phase === "analyzing"
                  ? {
                      ...item,
                      progress: Math.min(item.progress + 4 + Math.random() * 4, 88),
                    }
                  : item,
              )
            : null,
        );
      }, 350);

      const formData = new FormData();
      formData.append("files", file);

      try {
        const res = await fetch("/api/admin/upload-proposal", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        let result: ApiSuccess | ApiFail;
        try {
          result = (await res.json()) as ApiSuccess | ApiFail;
        } catch {
          clearInterval(progressTimer);
          setQueue((prev) =>
            prev
              ? prev.map((item) =>
                  item.id === rowId
                    ? {
                        ...item,
                        phase: "error",
                        error: `응답 파싱 실패 (${res.status})`,
                        progress: 0,
                      }
                    : item,
                )
              : null,
          );
          failCount += 1;
          continue;
        }

        clearInterval(progressTimer);

        const preview =
          result.success && result.previews?.[0]
            ? result.previews[0]
            : result.success && result.draftId
              ? {
                  draftId: result.draftId,
                  mediaName: file.name.replace(/\.[^.]+$/, ""),
                  category: "ETC",
                  trustScore: null,
                  description: null,
                  tags: [] as string[],
                  address: null,
                  district: null,
                  price: null,
                  cpm: null,
                }
              : null;

        if (res.ok && result.success && preview) {
          successCount += 1;
          setQueue((prev) =>
            prev
              ? prev.map((item) =>
                  item.id === rowId
                    ? {
                        ...item,
                        phase: "done",
                        progress: 100,
                        draftId: preview.draftId,
                        preview,
                        detailOpen: false,
                      }
                    : item,
                )
              : null,
          );
        } else {
          failCount += 1;
          const err =
            !result.success && "error" in result
              ? result.error
              : !res.ok
                ? `요청 실패 (${res.status})`
                : "처리 실패";
          setQueue((prev) =>
            prev
              ? prev.map((item) =>
                  item.id === rowId
                    ? { ...item, phase: "error", error: err, progress: 0 }
                    : item,
                )
              : null,
          );
        }
      } catch {
        failCount += 1;
        clearInterval(progressTimer);
        setQueue((prev) =>
          prev
            ? prev.map((item) =>
                item.id === rowId
                  ? {
                      ...item,
                      phase: "error",
                      error: "네트워크 오류",
                      progress: 0,
                    }
                  : item,
              )
            : null,
        );
      }
    }

    setIsProcessing(false);
    if (successCount > 0) {
      toast({
        title:
          failCount > 0
            ? `${successCount}건 완료 · ${failCount}건 실패`
            : "추출 완료",
        description:
          "아래 목록에서 「추출 데이터 확인·수정」을 눌러 추출된 내용을 수정·저장할 수 있습니다.",
      });
    } else if (failCount > 0) {
      toast({
        title: "추출 실패",
        description: "목록에서 오류 내용을 확인해 주세요.",
        variant: "destructive",
      });
    }
  }, [files, toast]);

  const toggleDetail = React.useCallback((rowId: string) => {
    setQueue((prev) =>
      prev
        ? prev.map((item) =>
            item.id === rowId
              ? { ...item, detailOpen: !item.detailOpen }
              : item,
          )
        : null,
    );
  }, []);

  const openDetail = React.useCallback((rowId: string) => {
    setQueue((prev) =>
      prev
        ? prev.map((item) =>
            item.id === rowId ? { ...item, detailOpen: true } : item,
          )
        : null,
    );
  }, []);

  const clearQueue = React.useCallback(() => {
    setQueue(null);
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-sky-800/50 bg-sky-950/30 px-4 py-3 text-sm text-sky-100/90">
        <p>
          PDF·PPT를 업로드하면 AI가 매체 정보를 추출합니다. 완료 후 목록에서{" "}
          <strong className="text-sky-200">추출 데이터 확인·수정</strong>을 누르면
          추출된 데이터를 수정·확인한 뒤 임시 저장 또는 공개할 수 있습니다.
        </p>
      </div>

      <UploadDropzone
        files={files}
        onFilesChange={setFiles}
        disabled={isProcessing}
      />

      <UploadButton
        hasFiles={hasValidFile}
        onUpload={handleUpload}
        disabled={isProcessing}
      />

      {queue && queue.length > 0 && (
        <div className="space-y-3 border-t border-zinc-800 pt-6">
          <AiUploadAnalysisQueue
            items={queue}
            locale={locale}
            anyAnalyzing={anyAnalyzing}
            onToggleDetail={toggleDetail}
            onOpenDetail={openDetail}
          />
          {!isProcessing && (
            <button
              type="button"
              onClick={clearQueue}
              className="text-xs text-zinc-500 underline hover:text-zinc-300"
            >
              목록 지우고 새로 업로드
            </button>
          )}
        </div>
      )}
    </div>
  );
}
