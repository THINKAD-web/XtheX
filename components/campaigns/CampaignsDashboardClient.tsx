"use client";

import * as React from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignStatus } from "@prisma/client";
import { Sparkles, ChevronDown } from "lucide-react";
import { landing } from "@/lib/landing-theme";

export type CampaignRow = {
  id: string;
  title: string | null;
  status: CampaignStatus;
  budget_krw: number;
  duration_weeks: number;
  createdAt: string;
  omniChannel: boolean;
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "초안",
  SUBMITTED: "제출됨",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
};

const STATUS_BADGE: Record<CampaignStatus, string> = {
  DRAFT:
    "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
  SUBMITTED:
    "border-amber-400 bg-amber-100 text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100",
  APPROVED:
    "border-emerald-500 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-100",
  REJECTED:
    "border-red-400 bg-red-100 text-red-950 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100",
};

const FILTERS: { key: string; label: string; status?: CampaignStatus }[] = [
  { key: "ALL", label: "전체" },
  { key: "DRAFT", label: "초안", status: "DRAFT" },
  { key: "SUBMITTED", label: "제출됨", status: "SUBMITTED" },
  { key: "APPROVED", label: "승인됨", status: "APPROVED" },
  { key: "REJECTED", label: "거절됨", status: "REJECTED" },
];

function formatKrw(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return `${n.toLocaleString()}원`;
}

export function CampaignsDashboardClient({
  campaigns,
  activeFilter,
}: {
  campaigns: CampaignRow[];
  activeFilter: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<CampaignRow | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const openEdit = (c: CampaignRow) => {
    setEditing(c);
    setEditTitle(c.title || "");
  };

  const saveTitle = async () => {
    if (!editing || !editTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/campaign/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        setEditing(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("이 캠페인을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/campaign/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const href =
            f.key === "ALL"
              ? "/dashboard/campaigns"
              : `/dashboard/campaigns?status=${f.key}`;
          const active = activeFilter === f.key;
          return (
            <Link
              key={f.key}
              href={href}
              className={`inline-flex h-11 items-center rounded-lg border px-4 text-sm font-medium transition-all ${
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-blue-500/40 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-blue-500/50 dark:hover:bg-zinc-800"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {campaigns.length === 0 ? (
        <div
          className={`${landing.card} flex flex-col items-center justify-center border-dashed py-16 text-center hover:scale-100`}
        >
          <Sparkles className="mb-4 h-12 w-12 text-blue-500/80" />
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            아직 캠페인이 없어요.
          </p>
          <p className="mt-2 max-w-sm text-pretty text-zinc-600 dark:text-zinc-400">
            지금 미디어 믹스로 캠페인 초안을 만들어 보세요.
          </p>
          <Link href="/#media-mix-ai" className={`${landing.btnPrimary} mt-8`}>
            미디어 믹스 검색하기
          </Link>
        </div>
      ) : (
        <div
          className={`${landing.surface} overflow-hidden dark:border-zinc-800 dark:bg-zinc-950/80`}
        >
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="border-zinc-200 hover:bg-transparent dark:border-zinc-800">
                <TableHead className="font-semibold">제목</TableHead>
                <TableHead className="font-semibold">상태</TableHead>
                <TableHead className="font-semibold">예산</TableHead>
                <TableHead className="font-semibold">기간</TableHead>
                <TableHead className="font-semibold">생성일</TableHead>
                <TableHead className="w-[120px] text-right font-semibold">
                  작업
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer border-zinc-200 dark:border-zinc-800"
                  onClick={() => router.push(`/campaign/${c.id}`)}
                >
                  <TableCell className="max-w-[260px] font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate">{c.title || "(제목 없음)"}</span>
                      {c.omniChannel ? (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-cyan-500/50 bg-gradient-to-r from-blue-600/15 to-cyan-500/15 text-xs font-medium text-cyan-800 dark:text-cyan-300"
                        >
                          옴니채널
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_BADGE[c.status]}
                    >
                      {STATUS_LABEL[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatKrw(c.budget_krw)}</TableCell>
                  <TableCell>{c.duration_weeks}주</TableCell>
                  <TableCell className="whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                    {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <details className="relative inline-block text-left">
                      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 [&::-webkit-details-marker]:hidden">
                        작업
                        <ChevronDown className="h-4 w-4 opacity-70" />
                      </summary>
                      <div className="absolute right-0 z-30 mt-1 min-w-[160px] rounded-xl border border-zinc-200 bg-white py-1 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
                        <button
                          type="button"
                          className="flex w-full items-center px-4 py-2.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          onClick={() => router.push(`/campaign/${c.id}`)}
                        >
                          상세 보기
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center px-4 py-2.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          onClick={() => openEdit(c)}
                        >
                          제목 편집
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                          disabled={deletingId === c.id}
                          onClick={(e) => remove(e as unknown as React.MouseEvent, c.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </details>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`${landing.card} w-full max-w-md hover:scale-100`}
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              캠페인 제목 편집
            </h2>
            <input
              className={`${landing.input} mt-4 dark:border-zinc-600 dark:bg-zinc-950`}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="제목"
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg px-6"
                onClick={() => setEditing(null)}
              >
                취소
              </Button>
              <Button
                type="button"
                className="h-11 rounded-lg px-6 font-medium"
                disabled={saving || !editTitle.trim()}
                onClick={saveTitle}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
