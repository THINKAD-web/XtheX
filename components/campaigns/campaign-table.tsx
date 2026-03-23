"use client";

import * as React from "react";
import { toast } from "sonner";
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

export type CampaignTableProps = {
  campaigns: CampaignRow[];
  activeFilter: string;
  /** 상태 필터 링크의 기본 경로 (예: `/advertiser`, `/dashboard/campaigns`) */
  listBasePath?: string;
};

export function CampaignTable({
  campaigns,
  activeFilter,
  listBasePath = "/dashboard/campaigns",
}: CampaignTableProps) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<CampaignRow | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [quickOpen, setQuickOpen] = React.useState(false);
  const [quickTitle, setQuickTitle] = React.useState("");
  const [quickBudget, setQuickBudget] = React.useState("1000000");
  const [quickWeeks, setQuickWeeks] = React.useState("4");
  const [quickSubmitting, setQuickSubmitting] = React.useState(false);
  const [optimisticRow, setOptimisticRow] = React.useState<CampaignRow | null>(
    null,
  );

  const displayCampaigns = React.useMemo(() => {
    if (!optimisticRow) return campaigns;
    return [optimisticRow, ...campaigns];
  }, [campaigns, optimisticRow]);

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
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.ok) {
        setEditing(null);
        toast.success("제목이 저장되었습니다.");
        router.refresh();
      } else {
        toast.error(data.error ?? "저장에 실패했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  const submitQuickCampaign = async () => {
    const title = quickTitle.trim();
    if (!title) {
      toast.error("캠페인 제목을 입력해 주세요.");
      return;
    }
    const budget = Number(quickBudget.replace(/,/g, ""));
    const weeks = Number(quickWeeks);
    if (!Number.isFinite(budget) || budget < 1) {
      toast.error("예산을 확인해 주세요.");
      return;
    }
    if (!Number.isFinite(weeks) || weeks < 1 || weeks > 104) {
      toast.error("기간(주)은 1~104 사이로 입력해 주세요.");
      return;
    }

    const pendingId = `pending-${Date.now()}`;
    const optimistic: CampaignRow = {
      id: pendingId,
      title,
      status: "DRAFT",
      budget_krw: Math.floor(budget),
      duration_weeks: Math.floor(weeks),
      createdAt: new Date().toISOString(),
      omniChannel: false,
    };
    setOptimisticRow(optimistic);
    setQuickSubmitting(true);
    const loadingId = toast.loading("캠페인 생성 중…");
    try {
      const res = await fetch("/api/campaign/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          budget_krw: Math.floor(budget),
          duration_weeks: Math.floor(weeks),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      toast.dismiss(loadingId);
      if (!res.ok) {
        setOptimisticRow(null);
        toast.error(data.error ?? "생성에 실패했습니다.");
        return;
      }
      toast.success("새 캠페인이 만들어졌습니다.");
      setQuickOpen(false);
      setQuickTitle("");
      setQuickBudget("1000000");
      setQuickWeeks("4");
      setOptimisticRow(null);
      router.refresh();
    } catch {
      toast.dismiss(loadingId);
      setOptimisticRow(null);
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setQuickSubmitting(false);
    }
  };

  const remove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("이 캠페인을 삭제할까요? 되돌릴 수 없습니다.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/campaign/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.ok) {
        toast.success("삭제되었습니다.");
        router.refresh();
      } else {
        toast.error(data.error ?? "삭제에 실패했습니다.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const href =
              f.key === "ALL"
                ? listBasePath
                : `${listBasePath}?status=${f.key}`;
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
        <Button
          type="button"
          className="h-11 shrink-0 rounded-lg px-4 font-medium"
          onClick={() => setQuickOpen(true)}
        >
          빠른 생성
        </Button>
      </div>

      {displayCampaigns.length === 0 ? (
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
                {displayCampaigns.map((c) => (
                  <TableRow
                    key={c.id}
                    className={`border-zinc-200 dark:border-zinc-800 ${
                      c.id.startsWith("pending-")
                        ? "cursor-default opacity-70"
                        : "cursor-pointer"
                    }`}
                    onClick={() => {
                      if (c.id.startsWith("pending-")) return;
                      router.push(`/campaign/${c.id}`);
                    }}
                  >
                    <TableCell className="max-w-[260px] font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate">
                          {c.title || "(제목 없음)"}
                        </span>
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
                            disabled={c.id.startsWith("pending-")}
                            onClick={() => router.push(`/campaign/${c.id}`)}
                          >
                            상세 보기
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center px-4 py-2.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            disabled={c.id.startsWith("pending-")}
                            onClick={() => openEdit(c)}
                          >
                            제목 편집
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            disabled={
                              deletingId === c.id ||
                              c.id.startsWith("pending-")
                            }
                            onClick={(e) =>
                              remove(e as unknown as React.MouseEvent, c.id)
                            }
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

      {quickOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className={`${landing.card} w-full max-w-md hover:scale-100`}>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              빠른 캠페인 생성
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              미디어 믹스 없이 초안만 만듭니다. 나중에 상세에서 편집할 수 있어요.
            </p>
            <label className="mt-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              제목
            </label>
            <input
              className={`${landing.input} mt-1 dark:border-zinc-600 dark:bg-zinc-950`}
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="예: 2025 봄 브랜드 캠페인"
              disabled={quickSubmitting}
            />
            <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              예산 (원)
            </label>
            <input
              type="number"
              min={1}
              className={`${landing.input} mt-1 dark:border-zinc-600 dark:bg-zinc-950`}
              value={quickBudget}
              onChange={(e) => setQuickBudget(e.target.value)}
              disabled={quickSubmitting}
            />
            <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              기간 (주)
            </label>
            <input
              type="number"
              min={1}
              max={104}
              className={`${landing.input} mt-1 dark:border-zinc-600 dark:bg-zinc-950`}
              value={quickWeeks}
              onChange={(e) => setQuickWeeks(e.target.value)}
              disabled={quickSubmitting}
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg px-6"
                disabled={quickSubmitting}
                onClick={() => setQuickOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                className="h-11 rounded-lg px-6 font-medium"
                disabled={quickSubmitting || !quickTitle.trim()}
                onClick={submitQuickCampaign}
              >
                만들기
              </Button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className={`${landing.card} w-full max-w-md hover:scale-100`}>
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
