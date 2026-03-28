"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, X, Check, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type MediaOption = { id: string; mediaName: string };

interface FileEntry {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  mediaId: string;
  errorMsg?: string;
}

interface Props {
  medias: MediaOption[];
}

export function BulkUploadClient({ medias }: Props) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [globalMediaId, setGlobalMediaId] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming).filter((f) => ACCEPTED.includes(f.type));
      if (arr.length === 0) {
        toast.error("Only JPG, PNG, and WebP files are accepted.");
        return;
      }
      const entries: FileEntry[] = arr.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
        progress: 0,
        status: "pending",
        mediaId: globalMediaId,
      }));
      setFiles((prev) => [...prev, ...entries]);
    },
    [globalMediaId],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((e) => e.id !== id);
    });
  }, []);

  const updateEntry = useCallback(
    (id: string, patch: Partial<FileEntry>) =>
      setFiles((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleUploadAll = async () => {
    const pending = files.filter((f) => f.status === "pending");
    const noMedia = pending.filter((f) => !f.mediaId);
    if (noMedia.length > 0) {
      toast.error("Please select a media for all files before uploading.");
      return;
    }
    if (pending.length === 0) {
      toast.info("No pending files to upload.");
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const entry of pending) {
      updateEntry(entry.id, { status: "uploading", progress: 10 });

      const form = new FormData();
      form.append("file", entry.file);
      form.append("mediaId", entry.mediaId);

      try {
        const xhr = new XMLHttpRequest();
        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (ev) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 90) + 5;
              updateEntry(entry.id, { progress: pct });
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
            }
          });
          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.open("POST", "/api/admin/bulk-upload");
          xhr.send(form);
        });

        updateEntry(entry.id, { status: "done", progress: 100 });
        successCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        updateEntry(entry.id, { status: "error", progress: 0, errorMsg: msg });
        errorCount++;
      }
    }

    setUploading(false);
    if (successCount > 0) toast.success(`${successCount} file(s) uploaded.`);
    if (errorCount > 0) toast.error(`${errorCount} file(s) failed.`);
  };

  const applyGlobalMedia = () => {
    if (!globalMediaId) return;
    setFiles((prev) =>
      prev.map((e) => (e.status === "pending" ? { ...e, mediaId: globalMediaId } : e)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Bulk Upload Photos</h1>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            Default media for new files
          </label>
          <Select value={globalMediaId} onValueChange={setGlobalMediaId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select media…" />
            </SelectTrigger>
            <SelectContent>
              {medias.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.mediaName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={applyGlobalMedia} disabled={!globalMediaId}>
          Apply to all pending
        </Button>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-14 transition-colors hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
      >
        <ImagePlus className="h-10 w-10 text-zinc-400" />
        <p className="text-sm text-muted-foreground">
          Drag &amp; drop images here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground/60">JPG, PNG, WebP</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((entry) => (
              <div
                key={entry.id}
                className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.preview}
                    alt={entry.file.name}
                    className="h-full w-full object-cover"
                  />
                  {entry.status !== "uploading" && (
                    <button
                      type="button"
                      onClick={() => removeFile(entry.id)}
                      className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {entry.status === "done" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-600/20">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                  )}
                  {entry.status === "uploading" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>

                {(entry.status === "uploading" || entry.status === "done") && (
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className={`h-full transition-all ${
                        entry.status === "done" ? "bg-green-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                )}

                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-medium">{entry.file.name}</p>

                  {entry.status === "error" && (
                    <p className="text-xs text-red-500">{entry.errorMsg}</p>
                  )}

                  {entry.status === "pending" && (
                    <Select
                      value={entry.mediaId}
                      onValueChange={(v) => updateEntry(entry.id, { mediaId: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select media…" />
                      </SelectTrigger>
                      <SelectContent>
                        {medias.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.mediaName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {entry.status === "done" && (
                    <p className="text-xs text-green-600 dark:text-green-400">Uploaded</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleUploadAll} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload All
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
