"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

export type AnalyzedMediaSamples = {
  urls: string[];
  descriptions: string[];
  descriptionExtras: string;
  warnings: string[];
};

export type MediaSamplesSectionHandle = {
  /** 제안서 업로드 직전 호출 */
  getFiles: () => File[];
  clear: () => void;
};

type Props = {
  disabled: boolean;
  /** 수동 「분석·업로드 실행」 결과 미리보기 */
  onAnalyzedPreview?: (payload: AnalyzedMediaSamples | null) => void;
};

export const MediaSamplesSection = React.forwardRef<
  MediaSamplesSectionHandle,
  Props
>(function MediaSamplesSection({ disabled, onAnalyzedPreview }, ref) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [files, setFiles] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [warnPick, setWarnPick] = React.useState<string | null>(null);
  const [phase, setPhase] = React.useState<
    "idle" | "analyzing" | "done" | "error"
  >("idle");
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [previewResult, setPreviewResult] =
    React.useState<AnalyzedMediaSamples | null>(null);

  React.useImperativeHandle(ref, () => ({
    getFiles: () => files,
    clear: () => {
      setFiles([]);
      previews.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]);
      setPhase("idle");
      setPreviewResult(null);
      setError(null);
      setWarnPick(null);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
      onAnalyzedPreview?.(null);
    },
  }));

  React.useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  const pickFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next: File[] = [];
    let over = false;
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      if (next.length >= MAX_FILES) {
        over = true;
        break;
      }
      if (!/^image\//i.test(f.type)) continue;
      if (f.size > MAX_BYTES) continue;
      next.push(f);
    }
    setWarnPick(
      list.length > MAX_FILES || over
        ? `최대 ${MAX_FILES}장만 사용됩니다. 처음 ${MAX_FILES}장만 반영됩니다.`
        : null,
    );
    setFiles(next);
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return next.map((f) => URL.createObjectURL(f));
    });
    setPhase("idle");
    setPreviewResult(null);
    setError(null);
    onAnalyzedPreview?.(null);
  };

  const runAnalyze = React.useCallback(async () => {
    if (files.length === 0) return;
    setPhase("analyzing");
    setError(null);
    setProgress(5);
    const tick = window.setInterval(() => {
      setProgress((p) => (p < 85 ? p + 6 + Math.random() * 4 : p));
    }, 400);

    const fd = new FormData();
    files.forEach((f) => fd.append("mediaSamples", f));

    try {
      const res = await fetch("/api/admin/media-samples", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = (await res.json()) as
        | {
            ok: true;
            urls: string[];
            descriptions: string[];
            descriptionExtras: string;
            warnings: string[];
          }
        | { ok: false; error: string };

      clearInterval(tick);
      setProgress(100);

      if (!res.ok || !j.ok || !("urls" in j)) {
        setPhase("error");
        setError(
          !j.ok && "error" in j
            ? j.error
            : `요청 실패 (${res.status})`,
        );
        return;
      }

      const payload: AnalyzedMediaSamples = {
        urls: j.urls,
        descriptions: j.descriptions,
        descriptionExtras: j.descriptionExtras ?? "",
        warnings: j.warnings ?? [],
      };
      setPreviewResult(payload);
      onAnalyzedPreview?.(payload);
      setPhase("done");
    } catch {
      clearInterval(tick);
      setPhase("error");
      setError("네트워크 오류");
      setProgress(0);
    }
  }, [files, onAnalyzedPreview]);

  return (
    <div className="space-y-4 rounded-xl border border-violet-800/40 bg-violet-950/20 px-4 py-4">
      <div>
        <h3 className="text-sm font-semibold text-violet-100">
          매체 사진 추가 업로드 (선택, 여러 장 가능)
        </h3>
        <p className="mt-1 text-xs text-violet-200/70">
          이미지 최대 {MAX_FILES}장 · 파일당 10MB 이하 · 버킷{" "}
          <code className="rounded bg-violet-950/80 px-1">media-samples</code> ·
          제안서 업로드 시 자동 분석(또는 아래로 미리 실행)
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(e) => pickFiles(e.target.files)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="border-violet-600/60 bg-violet-950/40 text-violet-100 hover:bg-violet-900/50"
          onClick={() => inputRef.current?.click()}
        >
          사진 추가
        </Button>
        {files.length > 0 && phase !== "analyzing" && (
          <>
            <Button
              type="button"
              size="sm"
              disabled={disabled}
              className="bg-violet-600 text-white hover:bg-violet-500"
              onClick={runAnalyze}
            >
              {phase === "done" ? "다시 분석" : "분석·업로드 실행"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                previews.forEach((u) => URL.revokeObjectURL(u));
                setPreviews([]);
                setPhase("idle");
                setPreviewResult(null);
                setWarnPick(null);
                if (inputRef.current) inputRef.current.value = "";
                onAnalyzedPreview?.(null);
              }}
              className="text-xs text-zinc-500 underline hover:text-zinc-300"
            >
              사진 비우기
            </button>
          </>
        )}
      </div>

      {warnPick && <p className="text-xs text-amber-400">{warnPick}</p>}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map((src) => (
            <div
              key={src}
              className="aspect-square overflow-hidden rounded-lg ring-1 ring-violet-800/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {phase === "analyzing" && (
        <div className="space-y-2">
          <p className="text-xs text-violet-200/80">
            Storage 업로드 및 Vision 분석 중…
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-violet-950">
            <div
              className="h-full rounded-full bg-violet-500 transition-[width] duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}

      {phase === "error" && error && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          <span>{error}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-red-600 text-red-200"
            onClick={runAnalyze}
          >
            재시도
          </Button>
        </div>
      )}

      {phase === "done" && previewResult && (
        <div className="space-y-2 rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-100/90">
          <p className="font-medium text-emerald-200">
            미리 분석 완료 · URL {previewResult.urls.length}건
          </p>
          {previewResult.warnings.length > 0 && (
            <ul className="list-inside list-disc text-amber-300/90">
              {previewResult.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          {previewResult.descriptions.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-emerald-800/30 pt-2 text-zinc-300">
              {previewResult.descriptions.map((d, i) => (
                <li key={i}>
                  <span className="text-emerald-400/80">#{i + 1}</span> {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});
