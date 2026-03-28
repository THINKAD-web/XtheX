"use client";

import * as React from "react";
import { Star, Check, X, Eye } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type AdminMediaReviewReportRow = {
  id: string;
  createdAt: string;
  reason: string | null;
  reporterLabel: string;
  reviewId: string;
  reviewRating: number;
  reviewContent: string | null;
  reviewAuthorLabel: string;
  mediaName: string;
  mediaId: string;
};

type Props = {
  rows: AdminMediaReviewReportRow[];
  labels: {
    empty: string;
    colDate: string;
    colMedia: string;
    colReview: string;
    colReporter: string;
    colReason: string;
    colActions: string;
    dismiss: string;
    hideReview: string;
    viewMedia: string;
    pending: string;
  };
};

export function AdminMediaReviewReportsClient({ rows: initialRows, labels }: Props) {
  const [rows, setRows] = React.useState(initialRows);
  const [busy, setBusy] = React.useState<string | null>(null);

  async function resolve(id: string, action: "dismiss" | "hide_review") {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/media-review-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400">{labels.colDate}</TableHead>
            <TableHead className="text-zinc-400">{labels.colMedia}</TableHead>
            <TableHead className="text-zinc-400">{labels.colReview}</TableHead>
            <TableHead className="text-zinc-400">{labels.colReporter}</TableHead>
            <TableHead className="text-zinc-400">{labels.colReason}</TableHead>
            <TableHead className="text-right text-zinc-400">{labels.colActions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-sm text-zinc-500">
                {labels.empty}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.id} className="border-zinc-800">
              <TableCell className="whitespace-nowrap text-sm text-zinc-500">
                {new Date(row.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="max-w-[140px]">
                <p className="truncate text-sm text-zinc-200">{row.mediaName}</p>
                <Link
                  href={`/medias/${row.mediaId}`}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
                >
                  <Eye className="h-3 w-3" />
                  {labels.viewMedia}
                </Link>
              </TableCell>
              <TableCell className="max-w-[220px]">
                <span className="inline-flex items-center gap-1 text-sm text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {row.reviewRating}
                </span>
                <p className="mt-1 truncate text-xs text-zinc-500">{row.reviewAuthorLabel}</p>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{row.reviewContent || "—"}</p>
              </TableCell>
              <TableCell className="max-w-[120px] truncate text-sm text-zinc-400">
                {row.reporterLabel}
              </TableCell>
              <TableCell className="max-w-[180px] text-xs text-zinc-500">
                {row.reason || "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                  <Badge variant="outline" className="border-amber-500/40 text-amber-500">
                    {labels.pending}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-zinc-400 hover:text-zinc-100"
                      disabled={busy === row.id}
                      onClick={() => resolve(row.id, "dismiss")}
                    >
                      <X className="h-3.5 w-3.5" />
                      {labels.dismiss}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-rose-400 hover:text-rose-300"
                      disabled={busy === row.id}
                      onClick={() => resolve(row.id, "hide_review")}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {labels.hideReview}
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
