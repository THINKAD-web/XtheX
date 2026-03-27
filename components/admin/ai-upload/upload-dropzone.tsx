"use client";

import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const ALLOWED_EXT = [".pdf", ".ppt", ".pptx"];
const MAX_BYTES = 50 * 1024 * 1024; // 50MB

export type FileWithStatus = {
  file: File;
  id: string;
  status: "pending" | "ready" | "error";
  error?: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type UploadDropzoneProps = {
  files: FileWithStatus[];
  onFilesChange: (files: FileWithStatus[]) => void;
  disabled?: boolean;
  className?: string;
};

export function UploadDropzone({
  files,
  onFilesChange,
  disabled,
  className,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const validate = React.useCallback((file: File): string | null => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!ALLOWED_EXT.includes(ext)) return "PDF, PPT, PPTX만 가능합니다.";
    if (file.size > MAX_BYTES) return "50MB 이하여야 합니다.";
    return null;
  }, []);

  const addFiles = React.useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      const next: FileWithStatus[] = [];
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        if (!file?.name) continue;
        const err = validate(file);
        next.push({
          file,
          id: `${Date.now()}-${i}-${file.name}`,
          status: err ? "error" : "ready",
          error: err ?? undefined,
        });
      }
      onFilesChange([...files, ...next]);
    },
    [files, onFilesChange, validate],
  );

  const removeAt = React.useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    addFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "relative min-h-[220px] rounded-2xl border-2 border-dashed transition-all duration-300 lg:min-h-[280px]",
          isDragOver
            ? "scale-[1.01] border-blue-400 bg-blue-50 shadow-md"
            : "border-zinc-300 bg-zinc-50 hover:border-blue-400 hover:bg-blue-50/60",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          multiple
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 lg:gap-4 lg:py-20">
          <p className="text-center text-base font-medium text-foreground lg:text-lg">
            PDF, PPT, PPTX를 드래그하거나 클릭하여 선택
          </p>
          <p className="text-center text-sm text-muted-foreground">최대 50MB · 여러 파일 선택 가능</p>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
          {files.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  {item.status === "ready" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : item.status === "error" ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                  ) : (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
                  )}
                  <span className="truncate font-medium text-zinc-900">{item.file.name}</span>
                  <span className="ml-2 shrink-0 text-zinc-500">{formatSize(item.file.size)}</span>
                </div>
                {item.status === "error" && item.error && (
                  <p className="mt-0.5 text-xs text-destructive">{item.error}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                aria-label="제거"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
