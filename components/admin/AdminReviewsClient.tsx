"use client";

import * as React from "react";
import { Star, Eye, EyeOff, Trash2 } from "lucide-react";
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

export type AdminReviewRow = {
  id: string;
  mediaName: string;
  mediaId: string;
  userName: string;
  userId: string;
  rating: number;
  content: string | null;
  visible: boolean;
  createdAt: string;
};

type Props = {
  rows: AdminReviewRow[];
};

export function AdminReviewsClient({ rows: initialRows }: Props) {
  const [rows, setRows] = React.useState(initialRows);
  const [busy, setBusy] = React.useState<string | null>(null);

  async function toggleVisibility(id: string, currentVisible: boolean) {
    setBusy(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !currentVisible }),
      });
      if (res.ok) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, visible: !currentVisible } : r,
          ),
        );
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this review?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
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
            <TableHead className="text-zinc-400">Media</TableHead>
            <TableHead className="text-zinc-400">User</TableHead>
            <TableHead className="text-zinc-400">Rating</TableHead>
            <TableHead className="text-zinc-400">Content</TableHead>
            <TableHead className="text-zinc-400">Visible</TableHead>
            <TableHead className="text-zinc-400">Date</TableHead>
            <TableHead className="text-right text-zinc-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-8 text-center text-sm text-zinc-500"
              >
                No reviews found.
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow key={row.id} className="border-zinc-800">
              <TableCell className="max-w-[160px] truncate text-sm text-zinc-200">
                {row.mediaName}
              </TableCell>
              <TableCell className="max-w-[140px] truncate text-sm text-zinc-300">
                {row.userName}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 text-sm text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  {row.rating}
                </span>
              </TableCell>
              <TableCell className="max-w-[240px] truncate text-sm text-zinc-400">
                {row.content || "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="default"
                  className={
                    row.visible
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-zinc-700 text-zinc-400"
                  }
                >
                  {row.visible ? "Visible" : "Hidden"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-zinc-500">
                {new Date(row.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
                    disabled={busy === row.id}
                    onClick={() => toggleVisibility(row.id, row.visible)}
                    title={row.visible ? "Hide" : "Show"}
                  >
                    {row.visible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400"
                    disabled={busy === row.id}
                    onClick={() => deleteReview(row.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
