"use client";

import * as React from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ContentApprovalItem = {
  id: string;
  mediaName: string;
  category: string;
  submittedAt: string;
  ownerEmail: string | null;
  ownerName: string | null;
};

type Props = {
  items: ContentApprovalItem[];
  locale: string;
};

export function ContentApprovalClient({ items, locale }: Props) {
  const t = useTranslations("admin.contentApproval");
  const tActions = useTranslations("admin.actions");
  const router = useRouter();
  const intlLocale = useLocale();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busyApprove, setBusyApprove] = React.useState(false);
  const [busyReject, setBusyReject] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [rejectTargetIds, setRejectTargetIds] = React.useState<string[]>([]);

  const dateFmt = React.useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale || locale, {
        dateStyle: "short",
        timeStyle: "short",
      }),
    [intlLocale, locale],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(items.map((i) => i.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const selectedList = React.useMemo(
    () => items.filter((i) => selected.has(i.id)),
    [items, selected],
  );

  const allSelected = items.length > 0 && selectedList.length === items.length;

  const openReject = (ids: string[]) => {
    if (ids.length === 0) return;
    setRejectTargetIds(ids);
    setRejectReason("");
    setRejectOpen(true);
  };

  const runApprove = async (ids: string[]) => {
    if (ids.length === 0) return;
    setBusyApprove(true);
    try {
      const res = await fetch("/api/admin/media/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        approved?: string[];
        skipped?: string[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? t("toastError"));
        return;
      }
      const n = data.approved?.length ?? 0;
      const skipped = data.skipped?.length ?? 0;
      if (n > 0) toast.success(t("toastApproved", { count: n }));
      if (skipped > 0) toast.message(t("toastPartial"));
      clearSelection();
      router.refresh();
    } catch {
      toast.error(t("toastError"));
    } finally {
      setBusyApprove(false);
    }
  };

  const confirmReject = async () => {
    if (rejectTargetIds.length === 0) return;
    setBusyReject(true);
    try {
      const res = await fetch("/api/admin/media/bulk-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: rejectTargetIds,
          reason: rejectReason.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        rejected?: string[];
        skipped?: string[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? t("toastError"));
        return;
      }
      const n = data.rejected?.length ?? 0;
      const skipped = data.skipped?.length ?? 0;
      if (n > 0) toast.success(t("toastRejected", { count: n }));
      if (skipped > 0) toast.message(t("toastPartial"));
      setRejectOpen(false);
      setRejectTargetIds([]);
      clearSelection();
      router.refresh();
    } catch {
      toast.error(t("toastError"));
    } finally {
      setBusyReject(false);
    }
  };

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("selectedCount", { count: selectedList.length })}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
            {t("selectAll")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
            {t("clearSelection")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={selectedList.length === 0 || busyApprove}
            onClick={() => runApprove(selectedList.map((i) => i.id))}
          >
            {busyApprove ? t("processing") : t("bulkApprove")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            disabled={selectedList.length === 0 || busyReject}
            onClick={() => openReject(selectedList.map((i) => i.id))}
          >
            {t("bulkReject")}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <span className="sr-only">{t("selectAll")}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={allSelected}
                  onChange={() => (allSelected ? clearSelection() : selectAll())}
                  aria-label={t("selectAll")}
                />
              </TableHead>
              <TableHead>{t("col_name")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("col_category")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("col_owner")}</TableHead>
              <TableHead className="hidden lg:table-cell">{t("col_submitted")}</TableHead>
              <TableHead className="text-right">{t("col_actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-input"
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    aria-label={row.mediaName}
                  />
                </TableCell>
                <TableCell className="max-w-[200px] font-medium">
                  <span className="line-clamp-2">{row.mediaName}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                    {row.category}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {row.category}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {row.ownerName || row.ownerEmail || "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell whitespace-nowrap text-sm text-muted-foreground">
                  {dateFmt.format(new Date(row.submittedAt))}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    <Link
                      href={`/admin/review/${row.id}`}
                      className={cn(
                        "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-medium",
                        "transition-all duration-150 hover:bg-accent hover:text-accent-foreground active:scale-95",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                      )}
                    >
                      {t("review")}
                    </Link>
                    <Button
                      size="sm"
                      disabled={busyApprove}
                      onClick={() => runApprove([row.id])}
                    >
                      {tActions("approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busyReject}
                      onClick={() => openReject([row.id])}
                    >
                      {tActions("reject")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t("rejectDialogTitle")}</DialogTitle>
            <DialogDescription>
              {rejectTargetIds.length > 1
                ? t("rejectDialogDescBulk", { count: rejectTargetIds.length })
                : t("rejectDialogDescSingle")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="content-reject-reason" className="text-sm font-medium">
              {t("rejectReasonLabel")}
            </label>
            <Textarea
              id="content-reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("rejectReasonPlaceholder")}
              rows={4}
              className={cn("resize-y min-h-[100px]")}
              maxLength={5000}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRejectOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="danger" disabled={busyReject} onClick={confirmReject}>
              {busyReject ? t("processing") : t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
