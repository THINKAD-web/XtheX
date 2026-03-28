"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "POST" | "COMMENT";
  postId: string | null;
  commentId?: string | null;
  onSubmitted: () => void;
};

export function ReportContentDialog({
  open,
  onOpenChange,
  targetType,
  postId,
  commentId,
  onSubmitted,
}: Props) {
  const t = useTranslations("community");
  const [reason, setReason] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  async function submit() {
    if (targetType === "POST" && !postId) return;
    if (targetType === "COMMENT" && !commentId) return;
    setSending(true);
    try {
      const res = await fetch("/api/community/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          postId: targetType === "POST" ? postId : undefined,
          commentId: targetType === "COMMENT" ? commentId : undefined,
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) return;
      onSubmitted();
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[200] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("report_title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="report-reason">{t("report_reason_label")}</Label>
          <Textarea
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("report_reason_ph")}
            rows={4}
            maxLength={2000}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={
              sending ||
              (targetType === "POST" && !postId) ||
              (targetType === "COMMENT" && !commentId)
            }
            onClick={() => void submit()}
          >
            {sending ? t("submitting") : t("report_submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
