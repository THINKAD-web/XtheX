"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, SendHorizontal, ImagePlus, X, MapPin, Save, ExternalLink, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { useToast } from "@/components/ui/use-toast";
import type {
  MixMediaResponse,
  MixProposal,
  MixMediaError,
  NaturalLanguageMixParse,
} from "@/lib/mix-media/types";
import { MixMediaMapLazy, type MixMapMarker } from "@/components/mix-media/MixMediaMapLazy";
import { landing } from "@/lib/landing-theme";
import { cn } from "@/lib/utils";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { useOmniCart } from "@/hooks/useOmniCart";
import { mixCategoryToOmni } from "@/lib/omni-cart/category";

const OMNI_CART_BTN =
  "shrink-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-2 py-1 text-[10px] font-medium text-white hover:from-blue-700 hover:to-cyan-600";

const CATEGORY_KO: Record<string, string> = {
  BILLBOARD: "빌보드",
  DIGITAL_BOARD: "디지털",
  TRANSIT: "대중교통",
  STREET_FURNITURE: "가로시설",
  WALL: "벽면",
  ETC: "기타",
};

function formatKrw(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return `${n.toLocaleString()}원`;
}

function formatReach(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억 노출(추정)`;
  if (n >= 10_000) return `약 ${Math.round(n / 10_000)}만 노출(추정)`;
  return `약 ${n.toLocaleString()} 노출(추정)`;
}

function useDebouncedValue<T>(value: T, ms: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return d;
}

function ProposalCard({
  proposal,
  isSelected,
  onSelect,
  onSaveThis,
  isSavingThis,
}: {
  proposal: MixProposal;
  isSelected: boolean;
  onSelect: () => void;
  onSaveThis: () => void;
  isSavingThis: boolean;
}) {
  const { add } = useOmniCart();
  const compareIds = proposal.media_ids.slice(0, 3).join(",");
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        landing.card,
        "cursor-pointer hover:brightness-[1.02] hover:shadow-2xl",
        isSelected &&
          "ring-2 ring-orange-500 ring-offset-2 dark:ring-orange-400 dark:ring-offset-zinc-950",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {isSelected && (
            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300">
              지도에서 강조
            </span>
          )}
          추천 조합
        </CardTitle>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {proposal.reasoning_ko}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">총 비용</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatKrw(proposal.total_cost_krw)}
            </p>
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">
              추정 리치
            </span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatReach(proposal.estimated_reach)}
            </p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            매체 구성
          </p>
          <ul className="flex flex-wrap gap-2">
            {proposal.breakdown.map((b) => (
              <li
                key={b.category}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-500/15 dark:text-blue-300"
              >
                {CATEGORY_KO[b.category] ?? b.category} {b.pct}% · {b.count}면
              </li>
            ))}
          </ul>
        </div>
        <ul className="space-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {proposal.medias.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 border-b border-zinc-50 pb-1 last:border-0 dark:border-zinc-800/80"
            >
              <span className="min-w-0 flex-1 truncate">{m.mediaName}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-zinc-500">{CATEGORY_KO[m.category]}</span>
                <button
                  type="button"
                  className={OMNI_CART_BTN}
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = m.price;
                    add({
                      id: m.id,
                      mediaName: m.mediaName,
                      category: CATEGORY_KO[m.category],
                      mediaCategory: mixCategoryToOmni(m.category),
                      priceMin: p,
                      priceMax: p,
                      source: "mix",
                    });
                  }}
                >
                  옴니채널 담기
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div
          className="flex flex-wrap gap-2 pt-1"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Link
            href={`/compare?ids=${encodeURIComponent(compareIds)}`}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-medium text-white transition-all hover:bg-blue-600/90 sm:w-auto"
          >
            이 조합으로 비교하기
          </Link>
          {proposal.media_ids.length > 3 && (
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              탐색에서 나머지 매체 보기
            </Link>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full border-emerald-600/50 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-950/40 sm:w-auto"
            disabled={isSavingThis}
            onClick={(e) => {
              e.stopPropagation();
              onSaveThis();
            }}
          >
            {isSavingThis ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                이 조합 저장
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function buildMapMarkers(
  proposals: MixProposal[],
  selectedProposalId: string | null,
): MixMapMarker[] {
  const byId = new Map<
    string,
    MixMapMarker & { inSelectedCombo: boolean }
  >();

  for (const p of proposals) {
    const inSel = p.id === selectedProposalId;
    for (const m of p.medias) {
      if (m.lat == null || m.lng == null) continue;
      const prev = byId.get(m.id);
      if (!prev) {
        byId.set(m.id, {
          id: m.id,
          mediaName: m.mediaName,
          category: m.category,
          lat: m.lat,
          lng: m.lng,
          address: m.address,
          cpm: m.cpm,
          inSelectedCombo: inSel,
        });
      } else if (inSel) {
        prev.inSelectedCombo = true;
      }
    }
  }

  return Array.from(byId.values());
}

export function MediaMixSearchSection() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MixMediaResponse | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    null,
  );
  const [budgetSlider, setBudgetSlider] = useState<number | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcError, setRecalcError] = useState<string | null>(null);
  const budgetMaxRef = useRef(200_000_000);
  const parseSnapshotRef = useRef<NaturalLanguageMixParse | null>(null);
  const [savingProposalId, setSavingProposalId] = useState<string | null>(null);
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authWallOpen, setAuthWallOpen] = useState(false);

  const isDayUi = useLandingLightChrome();

  const debouncedBudget = useDebouncedValue(budgetSlider, 450);
  const lastRecalcBudget = useRef<number | null>(null);

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
    });
  }, []);

  const submit = async () => {
    setError(null);
    setResult(null);
    setSelectedProposalId(null);
    setBudgetSlider(null);
    setRecalcError(null);
    setDraftCampaignId(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("query", query.trim());
      if (file) fd.set("image", file);

      const res = await fetch("/api/mix-media", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as MixMediaResponse | MixMediaError;
      if (!data.ok) {
        setError("error" in data ? data.error : "요청 실패");
        return;
      }
      setResult(data);
      parseSnapshotRef.current = data.parse;
      budgetMaxRef.current = Math.min(
        500_000_000,
        Math.max(data.parse.budget_krw * 3, 100_000_000),
      );
      if (data.proposals[0]) {
        setSelectedProposalId(data.proposals[0].id);
      }
      lastRecalcBudget.current = data.parse.budget_krw;
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!result || debouncedBudget == null) return;
    if (debouncedBudget === result.parse.budget_krw) return;
    if (lastRecalcBudget.current === debouncedBudget) return;

    const parse = parseSnapshotRef.current;
    if (!parse) return;

    let cancelled = false;
    (async () => {
      setRecalculating(true);
      setRecalcError(null);
      try {
        const res = await fetch("/api/mix-media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recalculate: true,
            parse: { ...parse, budget_krw: debouncedBudget },
          }),
        });
        const data = (await res.json()) as MixMediaResponse | MixMediaError;
        if (cancelled) return;
        if (!data.ok) {
          setRecalcError(
            "error" in data ? data.error : "재계산에 실패했습니다.",
          );
          return;
        }
        parseSnapshotRef.current = data.parse;
        setResult((prev) =>
          prev
            ? {
                ...prev,
                parse: data.parse,
                proposals: data.proposals,
              }
            : data,
        );
        setBudgetSlider(null);
        lastRecalcBudget.current = data.parse.budget_krw;
        setSelectedProposalId((sid) => {
          if (data.proposals.some((p) => p.id === sid)) return sid;
          return data.proposals[0]?.id ?? null;
        });
      } catch {
        if (!cancelled) setRecalcError("네트워크 오류");
      } finally {
        if (!cancelled) setRecalculating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedBudget, result]);

  const sliderValue =
    budgetSlider ?? result?.parse.budget_krw ?? 10_000_000;
  const sliderMin = 1_000_000;
  const sliderMax = budgetMaxRef.current;
  const step = 1_000_000;

  const mapMarkers = useMemo(
    () =>
      result?.proposals?.length
        ? buildMapMarkers(result.proposals, selectedProposalId)
        : [],
    [result?.proposals, selectedProposalId],
  );

  const selectedProposal = result?.proposals.find(
    (p) => p.id === selectedProposalId,
  );

  const saveCombination = useCallback(
    async (proposal: MixProposal) => {
      const parse = result?.parse ?? parseSnapshotRef.current;
      if (!parse) return;
      if (!isSignedIn) {
        setAuthWallOpen(true);
        return;
      }
      setSavingProposalId(proposal.id);
      try {
        const res = await fetch("/api/campaign/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parse: {
              target: parse.target,
              audience_tags: parse.audience_tags,
              budget_krw: parse.budget_krw,
              duration_weeks: parse.duration_weeks,
              location_keywords: parse.location_keywords,
              goal: parse.goal,
              style_notes: parse.style_notes,
              preferred_categories: parse.preferred_categories,
            },
            proposal: {
              id: proposal.id,
              media_ids: proposal.media_ids,
              total_cost_krw: proposal.total_cost_krw,
              estimated_reach: proposal.estimated_reach,
              breakdown: proposal.breakdown,
              reasoning_ko: proposal.reasoning_ko,
            },
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          error?: string;
          campaign?: { id: string };
        };
        if (!res.ok || !data.ok || !data.campaign?.id) {
          toast({
            variant: "destructive",
            title: "저장 실패",
            description: data.error ?? "다시 시도해 주세요.",
          });
          return;
        }
        setDraftCampaignId(data.campaign.id);
        toast({
          title: "캠페인 초안 저장됨!",
          description: "제출하시겠어요? 아래 제출 버튼으로 매체사에 알림을 보낼 수 있습니다.",
        });
      } catch {
        toast({
          variant: "destructive",
          title: "저장 실패",
          description: "네트워크 오류가 발생했습니다.",
        });
      } finally {
        setSavingProposalId(null);
      }
    },
    [isSignedIn, result?.parse, toast],
  );

  const submitCampaign = useCallback(async () => {
    if (!draftCampaignId || !isSignedIn) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/campaign/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: draftCampaignId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast({
          variant: "destructive",
          title: "제출 실패",
          description: data.error ?? "다시 시도해 주세요.",
        });
        return;
      }
      setDraftCampaignId(null);
      toast({
        title: "캠페인이 제출되었습니다",
        description: "매체사 알림이 전달되었습니다. 곧 대시보드에서 목록을 확인할 수 있습니다.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "제출 실패",
        description: "네트워크 오류가 발생했습니다.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [draftCampaignId, isSignedIn, toast]);

  return (
    <section
      id="media-mix-ai"
      className={cn(
        landing.sectionAlt,
        "relative border-t py-20 lg:py-28",
        isDayUi
          ? "border-zinc-200 bg-gradient-to-b from-zinc-50 via-white to-zinc-100"
          : "border-zinc-800/50 bg-gradient-to-b from-zinc-950 to-zinc-900/60",
      )}
    >
      <div
        className={
          result ? landing.container : "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"
        }
      >
        <h2
          className={cn(
            "text-center text-3xl font-bold tracking-tight lg:text-4xl",
            isDayUi ? "text-zinc-900" : "text-zinc-50",
          )}
        >
          자연어로 미디어 믹스 추천
        </h2>
        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-pretty text-center text-base leading-relaxed lg:text-lg",
            isDayUi ? "text-zinc-600" : "text-zinc-400",
          )}
        >
          타겟·예산·기간·지역을 문장으로 입력하면 AI가 파싱하고, DB 매체를
          조합해 3~5개 제안을 드립니다. 크리에이티브 이미지를 올리면 스타일
          힌트도 반영합니다.
        </p>

        <div
          className={cn(
            "mt-10 overflow-hidden rounded-2xl border shadow-xl lg:mt-12",
            isDayUi
              ? "border-zinc-200 bg-white text-zinc-900 shadow-zinc-200/40"
              : "border-zinc-700/80 bg-zinc-900/95 text-zinc-100 shadow-black/40",
          )}
        >
          <div
            className={cn(
              "border-b px-4 py-3",
              isDayUi
                ? "border-zinc-200 bg-zinc-50"
                : "border-zinc-700/80 bg-zinc-800/60",
            )}
          >
            <p
              className={cn(
                "text-sm",
                isDayUi ? "text-zinc-600" : "text-zinc-400",
              )}
            >
              예: 20대 여성 타겟, 예산 5000만원, 서울 강남 중심 4주, 카페 브랜드
              젊고 트렌디한 느낌
            </p>
          </div>
          <textarea
            className={cn(
              "min-h-[160px] w-full resize-y border-0 bg-transparent px-4 py-5 text-base leading-relaxed placeholder:text-zinc-400 focus:outline-none focus:ring-0 lg:min-h-[180px] lg:text-lg",
              isDayUi ? "text-zinc-900" : "text-zinc-100",
            )}
            placeholder="캠페인 브리프를 자유롭게 입력하세요…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            aria-label="미디어 믹스 브리프"
          />
          <div
            className={cn(
              "flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
              isDayUi ? "border-zinc-200" : "border-zinc-700/80",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="mix-media-image"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                disabled={loading}
              />
              <label htmlFor="mix-media-image" className="cursor-pointer">
                <span
                  className={cn(
                    "inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border px-4 text-sm font-medium",
                    isDayUi
                      ? "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                      : "border-zinc-600 bg-zinc-800/80 text-zinc-100 hover:bg-zinc-800",
                  )}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  크리에이티브 (선택)
                </span>
              </label>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onFile(null)}
                  className="text-zinc-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              type="button"
              onClick={submit}
              disabled={loading || query.trim().length < 8}
              className="h-11 min-w-[140px] rounded-lg px-6 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  분석 중
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  추천 받기
                </>
              )}
            </Button>
          </div>
          {preview && (
            <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="첨부 미리보기"
                className="max-h-32 rounded-lg object-contain"
              />
            </div>
          )}
        </div>

        {error && (
          <p
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        {authWallOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mix-auth-title"
          >
            <Card className="max-w-md border-zinc-200 shadow-xl dark:border-zinc-700">
              <CardHeader>
                <CardTitle id="mix-auth-title">로그인이 필요합니다</CardTitle>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  캠페인을 저장하려면 로그인해 주세요.
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  로그인
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAuthWallOpen(false)}
                >
                  닫기
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {result && (
          <div className="mt-12 space-y-8 lg:mt-16 lg:space-y-10">
            {draftCampaignId && (
              <Card className="border-emerald-200 bg-emerald-50/90 dark:border-emerald-800 dark:bg-emerald-950/50">
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                      초안이 저장되었습니다
                    </p>
                    <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-200/90">
                      제출하면 매체사 측 알림 훅이 실행됩니다. (이메일·Slack은
                      환경변수로 확장 가능)
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <Link
                        href={`/campaign/${draftCampaignId}`}
                        className="inline-flex items-center gap-1.5 font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        캠페인 상세 보기
                      </Link>
                      <Link
                        href="/dashboard/campaigns"
                        className="inline-flex items-center gap-1.5 font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                        대시보드에서 보기
                      </Link>
                    </div>
                  </div>
                  <Button
                      type="button"
                      className="shrink-0 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600"
                      disabled={submitting}
                      onClick={submitCampaign}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          제출 중…
                        </>
                      ) : (
                        "캠페인 제출"
                      )}
                    </Button>
                </CardContent>
              </Card>
            )}
            {result.creative_analysis_ko && (
              <Card className="border-blue-200/60 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    크리에이티브 스타일 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-900/90 dark:text-blue-100/90">
                  {result.creative_analysis_ko}
                </CardContent>
              </Card>
            )}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
              <strong className="text-zinc-800 dark:text-zinc-200">
                파싱 요약
              </strong>
              : 예산 {formatKrw(result.parse.budget_krw)} ·{" "}
              {result.parse.duration_weeks}주 · 지역{" "}
              {result.parse.location_keywords.join(", ") || "—"} · 목표{" "}
              {result.parse.goal}
            </div>

            <div className={cn(landing.surface, "p-5 lg:p-6")}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="mix-budget-slider"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  예산 조정 (실시간 재조합)
                </label>
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  {formatKrw(sliderValue)}
                  {recalculating && (
                    <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />
                  )}
                </span>
              </div>
              <input
                id="mix-budget-slider"
                type="range"
                min={sliderMin}
                max={sliderMax}
                step={step}
                value={Math.min(sliderMax, Math.max(sliderMin, sliderValue))}
                onChange={(e) =>
                  setBudgetSlider(Number(e.target.value))
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-orange-500 dark:bg-zinc-700 dark:accent-orange-400"
                aria-valuemin={sliderMin}
                aria-valuemax={sliderMax}
                aria-valuenow={sliderValue}
              />
              <div className="mt-1 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>{formatKrw(sliderMin)}</span>
                <span>{formatKrw(sliderMax)}</span>
              </div>
              {recalcError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {recalcError}
                </p>
              )}
            </div>

            {selectedProposal && (
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-orange-200/80 bg-orange-50/90 px-4 py-3 text-sm dark:border-orange-900/50 dark:bg-orange-950/40">
                <MapPin className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                    선택한 조합
                  </p>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    총 비용{" "}
                    <strong>{formatKrw(selectedProposal.total_cost_krw)}</strong>
                    {" · "}
                    추정 리치{" "}
                    <strong>
                      {formatReach(selectedProposal.estimated_reach)}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {result.proposals.length === 0 ? (
              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                조건에 맞는 매체 조합을 찾지 못했습니다. 예산을 늘리거나 지역을
                넓혀 보세요.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                  {result.proposals.map((p) => (
                    <ProposalCard
                      key={p.id}
                      proposal={p}
                      isSelected={p.id === selectedProposalId}
                      onSelect={() => setSelectedProposalId(p.id)}
                      onSaveThis={() => saveCombination(p)}
                      isSavingThis={savingProposalId === p.id}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-zinc-900 dark:text-zinc-100 lg:text-lg">
                    <MapPin className="h-5 w-5 shrink-0" />
                    제안 매체 위치 (클러스터 · 클릭 시 상세)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    주황 핀은 선택한 조합에 포함된 매체입니다.{" "}
                    {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                      ? "Google 지도 (한국어)"
                      : "Leaflet + CARTO (다크/라이트 테마)"}
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-border shadow-xl dark:border-zinc-700">
                    <MixMediaMapLazy markers={mapMarkers} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
