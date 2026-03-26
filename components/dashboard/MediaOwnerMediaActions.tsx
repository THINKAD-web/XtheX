"use client";

import * as React from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Props = {
  mediaId: string;
  status?: string;
  disabled?: boolean;
};

export function MediaOwnerMediaActions({ mediaId, status, disabled }: Props) {
  const editHref =
    status === "PENDING" || status === "REJECTED"
      ? `/dashboard/media-owner/medias/${mediaId}/review`
      : `/dashboard/media-owner/medias/${mediaId}/edit`;
  const [pending, setPending] = React.useState(false);
  const pathname = usePathname();

  async function onDelete() {
    if (disabled || pending) return;
    const ok = window.confirm(
      "정말 삭제하시겠습니까?\n게시된 매체는 삭제 대신 ARCHIVED 처리됩니다.",
    );
    if (!ok) return;

    setPending(true);
    try {
      const res = await fetch(`/api/media-owner/medias/${mediaId}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error("삭제에 실패했습니다.", { description: data.error });
        return;
      }
      toast.success("삭제 처리되었습니다.");
      // refresh current list
      if (pathname) window.location.reload();
    } catch (e) {
      toast.error("네트워크 오류가 발생했습니다.", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={editHref}
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
          (disabled || pending) && "pointer-events-none opacity-50",
        )}
        title={
          status === "PENDING"
            ? "검토·수정 (승인 대기)"
            : status === "REJECTED"
              ? "반려 안내·재신청"
              : "상세/수정"
        }
      >
        <Pencil className="mr-2 h-4 w-4" />
        {status === "PENDING" ? "검토" : status === "REJECTED" ? "안내" : "수정"}
      </Link>
      <Button
        type="button"
        variant="outline"
        className="text-red-600 hover:text-red-700"
        onClick={() => void onDelete()}
        disabled={disabled || pending}
        title="삭제"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {pending ? "처리 중…" : "삭제"}
      </Button>
    </div>
  );
}

