"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, Loader2, Upload, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type CaseStudyData = {
  id: string;
  title: string;
  description: string | null;
  client: string | null;
  result: string | null;
  images: string[];
};

type Props = {
  caseStudy: CaseStudyData;
  onClose: () => void;
};

export function AdminCaseStudyEditModal({ caseStudy, onClose }: Props) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [images, setImages] = React.useState<string[]>(caseStudy.images);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [form, setForm] = React.useState({
    title: caseStudy.title,
    description: caseStudy.description ?? "",
    client: caseStudy.client ?? "",
    result: caseStudy.result ?? "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("mediaSamples", file);
      });

      const res = await fetch("/api/admin/media-samples", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("업로드 실패");

      const data = await res.json();
      if (data.urls && data.urls.length > 0) {
        setImages((prev) => [...prev, ...data.urls]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError("제목은 필수입니다.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: form.title,
        description: form.description || null,
        client: form.client || null,
        result: form.result || null,
        images: images,
      };

      const res = await fetch(`/api/admin/case-study/${caseStudy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이 진행사례를 삭제하시겠습니까?")) return;
    
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/case-study/${caseStudy.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setDeleting(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">진행사례 수정</DialogTitle>
          <DialogDescription className="text-zinc-400">
            진행사례 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              제목 *
            </label>
            <input
              className={inputCls}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              클라이언트
            </label>
            <input
              className={inputCls}
              value={form.client}
              onChange={(e) => set("client", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              설명
            </label>
            <textarea
              className={`${inputCls} min-h-[80px] resize-y`}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              성과 (Result)
            </label>
            <textarea
              className={`${inputCls} min-h-[60px] resize-y`}
              value={form.result}
              onChange={(e) => set("result", e.target.value)}
            />
          </div>

          {/* 이미지 섹션 */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              이미지
            </label>
            
            {images.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`이미지 ${i + 1}`}
                      className="h-20 w-full rounded-md object-cover border border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-600 bg-zinc-900/50 px-4 py-4 text-sm text-zinc-400 hover:border-orange-500 hover:bg-zinc-900 hover:text-orange-400 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  이미지 추가
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || uploading || deleting || !form.title.trim()}
            className="flex-1"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            저장
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={saving || uploading || deleting}
          >
            {deleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            삭제
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
