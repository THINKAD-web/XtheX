"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  UploadDropzone,
  type FileWithStatus,
} from "@/components/admin/ai-upload/upload-dropzone";

export function MediaOwnerAiUploadForm() {
  const router = useRouter();
  const locale = useLocale();
  const [files, setFiles] = React.useState<FileWithStatus[]>([]);
  const [pending, setPending] = React.useState(false);

  const ready = files.filter((f) => f.status === "ready");

  async function handleSubmit() {
    if (ready.length === 0) {
      toast.error("PDF/PPT 제안서를 선택해 주세요.");
      return;
    }

    setPending(true);
    try {
      const fd = new FormData();
      for (const item of ready) {
        fd.append("files", item.file);
      }

      const res = await fetch("/api/media-owner/upload-proposal", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        mediaIds?: string[];
        firstMediaId?: string;
      };

      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "AI 업로드 처리에 실패했습니다.");
        return;
      }

      toast.success("등록 신청이 완료되었습니다.", {
        description: "관리자 검토 대기 상태로 저장되었습니다.",
      });

      if (data.firstMediaId) {
        router.push(
          `/${locale}/dashboard/media-owner/medias/${data.firstMediaId}/review`,
        );
      } else {
        router.push(`/${locale}/dashboard/media-owner/medias`);
      }
      router.refresh();
    } catch (e) {
      toast.error("AI 업로드 중 오류가 발생했습니다.", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-zinc-950/80 p-5">
      <p className="text-sm text-zinc-300">
        업로드 시 AI가 필드를 추출하고, 검토 화면에서 수정할 수 있습니다.
      </p>
      <UploadDropzone files={files} onFilesChange={setFiles} disabled={pending} />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          disabled={pending || ready.length === 0}
          onClick={handleSubmit}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          등록 신청
        </Button>
        <span className="text-xs text-zinc-500">
          완료 후 관리자 승인 대기 상태로 저장됩니다.
        </span>
      </div>
    </div>
  );
}

