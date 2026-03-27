"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Props = {
  mediaId: string;
};

export function AdminCaseStudyModal({ mediaId }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    client: "",
    result: "",
  });

  function reset() {
    setForm({ title: "", description: "", client: "", result: "" });
    setUploadedUrls([]);
    setError(null);
  }

  function handleOpen() {
    reset();
    setOpen(true);
  }

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

      if (!res.ok) {
        throw new Error("업로드 실패");
      }

      const data = await res.json();
      if (data.urls && data.urls.length > 0) {
        setUploadedUrls((prev) => [...prev, ...data.urls]);
      }
      if (data.warnings && data.warnings.length > 0) {
        setError(data.warnings.join(", "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeImage(index: number) {
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index));
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
        description: form.description || undefined,
        client: form.client || undefined,
        result: form.result || undefined,
        images: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      };

      const res = await fetch(`/api/admin/media/${mediaId}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300 ring-1 ring-orange-500/30 hover:bg-orange-500/20 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        진행사례 추가
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">진행사례 추가</DialogTitle>
            <DialogDescription className="text-zinc-400">
              이 매체의 실제 집행 사례를 등록합니다.
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
                placeholder="예: 삼성전자 갤럭시 캠페인"
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
                placeholder="광고주명"
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
                placeholder="캠페인 내용 및 배경"
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
                placeholder="예: CTR 2.5% 달성, 브랜드 인지도 30% 상승"
              />
            </div>

            {/* 이미지 업로드 섹션 */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                이미지 업로드
              </label>
              
              {/* 업로드된 이미지 미리보기 */}
              {uploadedUrls.length > 0 && (
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {uploadedUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt={`업로드 ${i + 1}`}
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

              {/* 업로드 버튼 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-600 bg-zinc-900/50 px-4 py-6 text-sm text-zinc-400 hover:border-orange-500 hover:bg-zinc-900 hover:text-orange-400 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    클릭하여 이미지 선택 (최대 5장)
                  </>
                )}
              </button>
              <p className="mt-1 text-[10px] text-zinc-500">
                JPG, PNG, WebP (최대 10MB/장)
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || uploading || !form.title.trim()}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              등록
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving || uploading}
            >
              취소
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
