"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, SendHorizontal, ImagePlus, X, MapPin, Save, ExternalLink, LayoutDashboard, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";
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

const useOmniCategoryLabel = () => {
  const locale = useLocale();
  const labels: Record<string, Record<string, string>> = {
    ko: { BILLBOARD: "빌보드", DIGITAL_BOARD: "디지털", TRANSIT: "대중교통", STREET_FURNITURE: "가로시설", WALL: "벽면", ETC: "기타" },
    en: { BILLBOARD: "Billboard", DIGITAL_BOARD: "Digital", TRANSIT: "Transit", STREET_FURNITURE: "Street", WALL: "Wall", ETC: "Other" },
    ja: { BILLBOARD: "ビルボード", DIGITAL_BOARD: "デジタル", TRANSIT: "交通広告", STREET_FURNITURE: "街頭施設", WALL: "壁面", ETC: "その他" },
    zh: { BILLBOARD: "广告牌", DIGITAL_BOARD: "数字屏", TRANSIT: "交通广告", STREET_FURNITURE: "街道设施", WALL: "墙面", ETC: "其他" },
  };
  return labels[locale] ?? labels.en;
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
  const tMix = useTranslations("home.mediaMix");
  const categoryLabel = useOmniCategoryLabel();
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
              {tMix("map_highlight")}
            </span>
          )}
          {tMix("combo_label")}
        </CardTitle>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {proposal.reasoning_ko}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">{tMix("total_cost")}</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatKrw(proposal.total_cost_krw)}
            </p>
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">
              {tMix("est_reach")}
            </span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatReach(proposal.estimated_reach)}
            </p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            {tMix("media_comp")}
          </p>
          <ul className="flex flex-wrap gap-2">
            {proposal.breakdown.map((b) => (
              <li
                key={b.category}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-500/15 dark:text-blue-300"
              >
                {categoryLabel[b.category] ?? b.category} {b.pct}% · {b.count}
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
                <span className="text-zinc-500">{categoryLabel[m.category]}</span>
                <button
                  type="button"
                  className={OMNI_CART_BTN}
                  onClick={(e) => {
                    e.stopPropagation();
                    const p = m.price;
                    add({
                      id: m.id,
                      mediaName: m.mediaName,
                      category: categoryLabel[m.category],
                      mediaCategory: mixCategoryToOmni(m.category),
                      priceMin: p,
                      priceMax: p,
                      source: "mix",
                    });
                  }}
                >
                  {tMix("omni_btn")}
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
            {tMix("compare_btn")}
          </Link>
          {proposal.media_ids.length > 3 && (
            <Link
              href="/explore"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
            >
              {tMix("explore_rest")}
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
                {tMix("saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {tMix("save_btn")}
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

const QUICK_QUESTIONS: Record<string, string[]> = {
  ko: [
    "일본 도쿄에서 게임 출시 광고, 예산 1억원 4주",
    "뉴욕 타임스스퀘어 한국 브랜드 광고 견적",
    "서울 강남 20대 여성 타겟 카페 브랜드 4주",
  ],
  en: [
    "Tokyo OOH campaign for game launch, $80K 4 weeks",
    "Times Square billboard for Korean brand, budget quote",
    "Seoul Gangnam 20s female target, café brand 4 weeks",
  ],
  ja: [
    "東京でゲームリリース広告、予算1億ウォン4週間",
    "ニューヨーク・タイムズスクエア韓国ブランド広告",
    "ソウル江南20代女性ターゲット、カフェブランド4週間",
  ],
  zh: [
    "东京游戏发布广告，预算1亿韩元4周",
    "纽约时代广场韩国品牌广告报价",
    "首尔江南20岁女性目标客群，咖啡品牌4周",
  ],
};

const DEMO_TOAST_KEY = "xthex_mix_demo_login_toast";

export function MediaMixSearchSection() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";
  const router = useRouter();
  const tMix = useTranslations("home.mediaMix");
  const locale = useLocale();
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
  const [sectionScale, setSectionScale] = useState(100);

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
    if (!isSignedIn && typeof window !== "undefined") {
      if (!sessionStorage.getItem(DEMO_TOAST_KEY)) {
        sessionStorage.setItem(DEMO_TOAST_KEY, "1");
        toast(tMix("demo_toast_title"), {
          description: tMix("demo_toast_description"),
          action: {
            label: tMix("demo_toast_login"),
            onClick: () => router.push("/login"),
          },
          duration: 12_000,
        });
      }
    }

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
        setError("error" in data ? data.error : tMix("error_request_failed"));
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
      setError(tMix("error_network"));
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
            "error" in data ? data.error : tMix("error_recalc_failed"),
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
        if (!cancelled) setRecalcError(tMix("error_network_short"));
      } finally {
        if (!cancelled) setRecalculating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedBudget, result, tMix]);

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
          toast.error(tMix("save_failed_title"), {
            description: data.error ?? tMix("try_again"),
          });
          return;
        }
        setDraftCampaignId(data.campaign.id);
        toast.success(tMix("draft_saved_title"), {
          description: tMix("draft_saved_desc"),
        });
      } catch {
        toast.error(tMix("save_failed_title"), {
          description: tMix("error_network"),
        });
      } finally {
        setSavingProposalId(null);
      }
    },
    [isSignedIn, result?.parse, tMix],
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
        toast.error(tMix("submit_failed_title"), {
          description: data.error ?? tMix("try_again"),
        });
        return;
      }
      setDraftCampaignId(null);
      toast.success(tMix("campaign_submitted_title"), {
        description: tMix("campaign_submitted_desc"),
      });
    } catch {
      toast.error(tMix("submit_failed_title"), {
        description: tMix("error_network"),
      });
    } finally {
      setSubmitting(false);
    }
  }, [draftCampaignId, isSignedIn, tMix]);

  const scaledPy = Math.round((sectionScale / 100) * 7);
  const sectionStyle: React.CSSProperties =
    sectionScale < 100
      ? {
          maxHeight: `${sectionScale}vh`,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
          paddingTop: `${scaledPy * 0.25}rem`,
          paddingBottom: `${scaledPy * 0.25}rem`,
        }
      : { transition: "max-height 0.3s ease" };

  return (
    <section
      id="media-mix-ai"
      style={sectionStyle}
      className={cn(
        landing.sectionAlt,
        "relative border-t py-20 lg:py-28",
        isDayUi
          ? "border-zinc-200 bg-gradient-to-b from-zinc-50 via-white to-zinc-100"
          : "border-zinc-800/50 bg-gradient-to-b from-zinc-950 to-zinc-900/60",
      )}
    >
      <div
        className={cn(
          "absolute right-4 top-3 z-10 flex items-center gap-2",
        )}
        title={tMix("section_resize")}
      >
        <Maximize2
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            isDayUi ? "text-zinc-400" : "text-zinc-500",
          )}
          aria-hidden
        />
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={sectionScale}
          onChange={(e) => setSectionScale(Number(e.target.value))}
          className={cn(
            "h-1.5 w-20 cursor-pointer appearance-none rounded-full",
            "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
            isDayUi
              ? "bg-zinc-200 accent-zinc-500 [&::-webkit-slider-thumb]:bg-zinc-500"
              : "bg-zinc-700 accent-zinc-400 [&::-webkit-slider-thumb]:bg-zinc-400",
          )}
          aria-label={tMix("section_resize")}
        />
        <span
          className={cn(
            "w-7 text-right text-[10px] tabular-nums",
            isDayUi ? "text-zinc-400" : "text-zinc-500",
          )}
        >
          {sectionScale}%
        </span>
      </div>

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
          {tMix("section_title")}
        </h2>
        <p
          className={cn(
            "mx-auto mt-4 max-w-2xl text-pretty text-center text-base leading-relaxed lg:text-lg",
            isDayUi ? "text-zinc-600" : "text-zinc-400",
          )}
        >
          {tMix("section_desc")}
        </p>

        {!isSignedIn ? (
          <div
            className={cn(
              "mx-auto mt-6 flex max-w-2xl flex-col items-center justify-center gap-2 rounded-xl border px-4 py-3 text-center transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-2 sm:flex-row sm:text-left",
              isDayUi
                ? "border-amber-200/90 bg-amber-50/90 text-amber-950 shadow-sm"
                : "border-amber-500/30 bg-amber-950/40 text-amber-100",
            )}
          >
            <p className="text-sm font-medium">{tMix("demo_watermark")}</p>
            <Link
              href="/login"
              className={cn(
                "shrink-0 text-sm font-semibold underline-offset-2 transition-colors hover:underline",
                isDayUi ? "text-blue-700" : "text-cyan-300",
              )}
            >
              {tMix("demo_toast_login")}
            </Link>
          </div>
        ) : null}

        <div
          className={cn(
            "mt-10 overflow-hidden rounded-2xl border shadow-xl transition-opacity duration-300 lg:mt-12",
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
              {tMix("hint_text")}
            </p>
          </div>
          <div className={cn(
            "flex flex-wrap gap-2 border-b px-4 py-3",
            isDayUi ? "border-zinc-100" : "border-zinc-800",
          )}>
            {(QUICK_QUESTIONS[locale] ?? QUICK_QUESTIONS.en).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setQuery(q);
                  setTimeout(() => submit(), 100);
                }}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/40"
              >
                {q}
              </button>
            ))}
          </div>
          <textarea
            className={cn(
              "min-h-[160px] w-full resize-y border-0 bg-transparent px-4 py-5 text-base leading-relaxed placeholder:text-zinc-400 focus:outline-none focus:ring-0 lg:min-h-[180px] lg:text-lg",
              isDayUi ? "text-zinc-900" : "text-zinc-100",
            )}
            placeholder={tMix("placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            aria-label={tMix("brief_aria")}
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
                  {tMix("creative_label")}
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
                  {tMix("analyze_btn")}
                </>
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  {tMix("recommend_btn")}
                </>
              )}
            </Button>
          </div>
          {preview && (
            <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={tMix("attachment_preview")}
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
                <CardTitle id="mix-auth-title">{tMix("login_required")}</CardTitle>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {tMix("save_login_prompt")}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {tMix("login_btn")}
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAuthWallOpen(false)}
                >
                  {tMix("close_btn")}
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
                      {tMix("draft_saved")}
                    </p>
                    <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-200/90">
                      {tMix("submit_note")}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <Link
                        href={`/campaign/${draftCampaignId}`}
                        className="inline-flex items-center gap-1.5 font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        {tMix("campaign_detail")}
                      </Link>
                      <Link
                        href="/dashboard/campaigns"
                        className="inline-flex items-center gap-1.5 font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5" aria-hidden />
                        {tMix("dashboard_view")}
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
                          {tMix("submitting")}
                        </>
                      ) : (
                        tMix("submit_campaign")
                      )}
                    </Button>
                </CardContent>
              </Card>
            )}
            {result.creative_analysis_ko && (
              <Card className="border-blue-200/60 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    {tMix("creative_analysis")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-900/90 dark:text-blue-100/90">
                  {result.creative_analysis_ko}
                </CardContent>
              </Card>
            )}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
              <strong className="text-zinc-800 dark:text-zinc-200">
                {tMix("parse_summary")}
              </strong>
              : {formatKrw(result.parse.budget_krw)} ·{" "}
              {result.parse.duration_weeks}w · {" "}
              {result.parse.location_keywords.join(", ") || "—"} · {" "}
              {result.parse.goal}
            </div>

            <div className={cn(landing.surface, "p-5 lg:p-6")}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="mix-budget-slider"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {tMix("budget_label")}
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
                    {tMix("selected_combo")}
                  </p>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {tMix("total_cost")}{" "}
                    <strong>{formatKrw(selectedProposal.total_cost_krw)}</strong>
                    {" · "}
                    {tMix("est_reach")}{" "}
                    <strong>
                      {formatReach(selectedProposal.estimated_reach)}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {result.proposals.length === 0 ? (
              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                {tMix("no_result")}
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
                    {tMix("map_title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tMix("map_sub")}
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
