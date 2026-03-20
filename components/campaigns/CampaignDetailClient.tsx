"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CampaignStatus } from "@prisma/client";
import { MixMediaMapLazy, type MixMapMarker } from "@/components/mix-media/MixMediaMapLazy";
import {
  ArrowLeft,
  MapPin,
  PanelTop,
  Monitor,
  TrainFront,
  LampDesk,
  BrickWall,
  Layers,
  CircleHelp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getOmniMediaCategory,
  OMNI_CATEGORY_LABEL_KO,
  orderedOmniCategories,
} from "@/lib/omni-cart/category";
import { buildOmniCampaignDetailPhases } from "@/lib/omni-cart/omni-detail-timeline";
import type { OmniCartItem, OmniMediaCategory } from "@/lib/omni-cart/types";

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

const CATEGORY_KO: Record<string, string> = {
  BILLBOARD: "빌보드",
  DIGITAL_BOARD: "디지털",
  TRANSIT: "대중교통",
  STREET_FURNITURE: "가로시설",
  WALL: "벽면",
  ETC: "기타",
};

const ORDER_SET = new Set<string>(orderedOmniCategories());

function formatKrw(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString()}만`;
  return `${n.toLocaleString()}원`;
}

function formatReach(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억 (추정)`;
  if (n >= 10_000) return `약 ${Math.round(n / 10_000)}만 (추정)`;
  return `약 ${n.toLocaleString()} (추정)`;
}

type MediaRow = {
  id: string;
  mediaName: string;
  category: string;
  cpm: number | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
};

type Breakdown = { category: string; count: number; pct: number };

function accordionKeyForMedia(m: MediaRow): OmniMediaCategory {
  if (ORDER_SET.has(m.category)) return m.category as OmniMediaCategory;
  return getOmniMediaCategory({
    id: m.id,
    mediaName: m.mediaName,
    category: m.category,
    priceMin: null,
    priceMax: null,
  } as OmniCartItem);
}

function CategoryIcon({ cat }: { cat: OmniMediaCategory }) {
  const cls = "h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400";
  switch (cat) {
    case "BILLBOARD":
      return <PanelTop className={cls} aria-hidden />;
    case "DIGITAL_BOARD":
      return <Monitor className={cls} aria-hidden />;
    case "TRANSIT":
      return <TrainFront className={cls} aria-hidden />;
    case "STREET_FURNITURE":
      return <LampDesk className={cls} aria-hidden />;
    case "WALL":
      return <BrickWall className={cls} aria-hidden />;
    case "ETC":
      return <Layers className={cls} aria-hidden />;
    default:
      return <CircleHelp className={cls} aria-hidden />;
  }
}

function OmniDetailTimeline({ medias }: { medias: MediaRow[] }) {
  const { segments, lines } = React.useMemo(
    () =>
      medias.length
        ? buildOmniCampaignDetailPhases(medias)
        : {
            segments: [
              {
                flex: 1,
                className:
                  "rounded-full bg-gradient-to-r from-blue-700 to-cyan-600 shadow-md shadow-cyan-600/25",
              },
              {
                flex: 1,
                className:
                  "rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500/80",
              },
              {
                flex: 1,
                className:
                  "rounded-full bg-gradient-to-r from-cyan-500/50 to-cyan-400/35",
              },
            ],
            lines: [
              "1주차: 인지도 → 대형 매체",
              "2주차: 관심 유도 → 디지털",
              "3~4주차: 행동 → 이동형",
            ] as [string, string, string],
          },
    [medias],
  );

  return (
    <div className="rounded-xl border border-cyan-500/25 bg-gradient-to-b from-blue-600/8 via-cyan-500/10 to-transparent p-4 shadow-lg shadow-cyan-950/10 dark:from-blue-950/40 dark:via-cyan-950/20 dark:to-zinc-900/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-400">
        옴니채널 타임라인
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        담긴 매체 조합 기준 추천 페이싱
      </p>
      <div
        className="mt-3 flex w-full gap-1.5"
        role="img"
        aria-label="3단계 캠페인 타임라인"
      >
        {segments.map((s, i) => (
          <div
            key={i}
            className={cn("h-2.5 min-w-[6px]", s.className)}
            style={{ flex: `${s.flex} 1 0%` }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
        {lines.map((line, i) => {
          const label = line.split(":")[0] ?? line;
          const rest = line.includes(":") ? line.slice(line.indexOf(":") + 1).trim() : "";
          return (
            <li key={i} className="border-l-2 border-cyan-500/30 pl-2.5">
              <span className="font-semibold text-cyan-700 dark:text-cyan-400">
                {label}
              </span>
              {rest ? (
                <>
                  : {rest}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CampaignDetailClient({
  title,
  status,
  budget_krw,
  duration_weeks,
  target_summary,
  location_summary,
  total_cost,
  estimated_reach,
  breakdown,
  reasoning_ko,
  medias,
  omniChannel = false,
  omniMediaCount = 0,
  omniFloorKrw = 0,
}: {
  title: string | null;
  status: CampaignStatus;
  budget_krw: number;
  duration_weeks: number;
  target_summary: string;
  location_summary: string;
  total_cost: number;
  estimated_reach: number;
  breakdown: Breakdown[];
  reasoning_ko: string | null;
  medias: MediaRow[];
  omniChannel?: boolean;
  omniMediaCount?: number;
  omniFloorKrw?: number;
}) {
  const markers: MixMapMarker[] = React.useMemo(
    () =>
      medias
        .filter((m) => m.lat != null && m.lng != null)
        .map((m) => ({
          id: m.id,
          mediaName: m.mediaName,
          category: m.category,
          lat: m.lat!,
          lng: m.lng!,
          address: m.address,
          cpm: m.cpm,
          inSelectedCombo: true,
        })),
    [medias],
  );

  const omniCeilKrw = React.useMemo(
    () => Math.round(omniFloorKrw * 1.4),
    [omniFloorKrw],
  );

  const mediasByCategory = React.useMemo(() => {
    const map = new Map<OmniMediaCategory, MediaRow[]>();
    for (const cat of orderedOmniCategories()) map.set(cat, []);
    for (const m of medias) {
      const k = accordionKeyForMedia(m);
      map.get(k)!.push(m);
    }
    return orderedOmniCategories()
      .map((cat) => ({ cat, items: map.get(cat) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [medias]);

  const defaultAccordion = mediasByCategory.map((g) => g.cat);

  const displayCost = omniChannel ? omniFloorKrw : total_cost;
  const displayCostLabel = omniChannel
    ? omniFloorKrw > 0
      ? `${formatKrw(omniFloorKrw)} ~ ${formatKrw(omniCeilKrw)}`
      : "단가 협의"
    : formatKrw(total_cost);

  const displayReach =
    omniChannel && estimated_reach <= 0
      ? "옴니채널 · 협의"
      : formatReach(estimated_reach);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8 xl:max-w-7xl">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>

        <div
          className={cn(
            "gap-8",
            omniChannel && "xl:grid xl:grid-cols-[1fr_300px]",
          )}
        >
          <div className="min-w-0 space-y-6">
            <div
              className={cn(
                "rounded-xl border bg-white p-6 dark:bg-zinc-900",
                omniChannel
                  ? "border-cyan-500/25 shadow-sm shadow-cyan-950/5 dark:border-cyan-500/20"
                  : "border-zinc-200 dark:border-zinc-800",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {omniChannel ? (
                    <div className="space-y-3">
                      <div className="inline-flex rounded-full bg-gradient-to-r from-cyan-600 to-blue-700 px-6 py-2 text-lg font-bold text-white shadow-lg shadow-cyan-900/25">
                        옴니채널 캠페인
                      </div>
                      <div>
                        <p className="text-base font-semibold text-cyan-800 dark:text-cyan-300">
                          통합 채널 {omniMediaCount || medias.length}개
                        </p>
                        <p className="mt-0.5 text-sm text-cyan-700/90 dark:text-cyan-400/85">
                          옴니채널 전략으로 최적화됨
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 border-t border-cyan-500/10 pt-3 dark:border-cyan-500/15">
                        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                          {title || "캠페인"}
                        </h1>
                      </div>
                    </div>
                  ) : (
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                      {title || "캠페인"}
                    </h1>
                  )}
                  <div
                    className={cn(
                      "flex flex-wrap gap-2",
                      omniChannel ? "mt-3" : "mt-2",
                    )}
                  >
                    <Badge variant="outline" className={STATUS_BADGE[status]}>
                      {STATUS_LABEL[status]}
                    </Badge>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      목표 예산 {formatKrw(budget_krw)} · {duration_weeks}주
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 border-t border-zinc-100 pt-6 dark:border-zinc-800 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-zinc-500">
                    타겟 요약
                  </p>
                  <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                    {target_summary}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-zinc-500">
                    지역
                  </p>
                  <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                    {location_summary}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  "mt-6 flex flex-wrap gap-6 rounded-lg p-4",
                  omniChannel
                    ? "border border-cyan-500/20 bg-gradient-to-r from-blue-600/8 to-cyan-500/10 dark:from-blue-950/30 dark:to-cyan-950/20"
                    : "bg-orange-50/90 dark:bg-orange-950/30",
                )}
              >
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    {omniChannel ? "추정 비용 범위" : "조합 총 비용"}
                  </p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      omniChannel
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400"
                        : "text-zinc-900 dark:text-zinc-50",
                    )}
                  >
                    {displayCostLabel}
                  </p>
                  {omniChannel && omniFloorKrw > 0 ? (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      하한 합산 · 상한 약 1.4배 가정
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    추정 리치
                  </p>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {displayReach}
                  </p>
                </div>
              </div>

              {reasoning_ko && !omniChannel ? (
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {reasoning_ko}
                </p>
              ) : null}

              {!omniChannel && breakdown.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {breakdown.map((b) => (
                    <span
                      key={b.category}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-500/15 dark:text-blue-300"
                    >
                      {CATEGORY_KO[b.category] ?? b.category} {b.pct}% ·{" "}
                      {b.count}면
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <h2
                className={cn(
                  "flex items-center gap-2 text-lg font-semibold",
                  omniChannel
                    ? "text-cyan-900 dark:text-cyan-200"
                    : "text-zinc-900 dark:text-zinc-50",
                )}
              >
                <MapPin
                  className={cn(
                    "h-5 w-5",
                    omniChannel && "text-cyan-600 dark:text-cyan-400",
                  )}
                />
                매체 위치
              </h2>
              <MixMediaMapLazy markers={markers} />
            </div>

            {omniChannel ? (
              <>
                <div className="rounded-xl border border-cyan-500/20 bg-white dark:border-cyan-500/15 dark:bg-zinc-900">
                  <h2 className="border-b border-cyan-500/10 px-4 py-3 text-base font-semibold text-cyan-950 dark:border-cyan-500/15 dark:text-cyan-100">
                    매체 목록 · 카테고리별 ({medias.length})
                  </h2>
                  <div className="px-2 pb-3 pt-1 sm:px-4">
                    <Accordion
                      type="multiple"
                      defaultValue={defaultAccordion}
                      className="w-full"
                    >
                      {mediasByCategory.map(({ cat, items }) => (
                        <AccordionItem
                          key={cat}
                          value={cat}
                          className="border-cyan-500/10 dark:border-cyan-500/15"
                        >
                          <AccordionTrigger className="rounded-lg px-2 py-3 hover:bg-muted/50 hover:no-underline dark:hover:bg-muted/30">
                            <span className="flex items-center gap-2 text-left font-semibold text-zinc-900 dark:text-zinc-50">
                              <CategoryIcon cat={cat} />
                              {OMNI_CATEGORY_LABEL_KO[cat]}
                              <Badge
                                variant="outline"
                                className="ml-1 border-cyan-500/25 font-normal text-cyan-800 dark:border-cyan-500/30 dark:text-cyan-300"
                              >
                                {items.length}개
                              </Badge>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-2">
                            <ul className="space-y-2.5 border-l-2 border-cyan-500/20 pl-3">
                              {items.map((m) => (
                                <li
                                  key={m.id}
                                  className="rounded-lg border border-cyan-500/10 bg-gradient-to-br from-cyan-500/[0.04] to-transparent px-3 py-2.5 dark:border-cyan-500/15 dark:from-cyan-500/[0.06]"
                                >
                                  <Link
                                    href={`/medias/${m.id}`}
                                    className="font-medium text-zinc-900 hover:text-cyan-600 dark:text-zinc-100 dark:hover:text-cyan-400"
                                  >
                                    {m.mediaName}
                                  </Link>
                                  <p className="mt-1 text-xs text-cyan-800/80 dark:text-cyan-400/90">
                                    CPM:{" "}
                                    {m.cpm != null
                                      ? `${m.cpm.toLocaleString("ko-KR")}원`
                                      : "협의"}
                                  </p>
                                  {m.address ? (
                                    <p className="mt-0.5 flex items-start gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-cyan-600 dark:text-cyan-500" />
                                      {m.address}
                                    </p>
                                  ) : (
                                    <p className="mt-0.5 text-xs text-zinc-400">
                                      위치 정보 없음
                                    </p>
                                  )}
                                  <Link
                                    href={`/medias/${m.id}`}
                                    className="mt-2 inline-flex text-xs font-medium text-cyan-600 hover:underline dark:text-cyan-400"
                                  >
                                    매체 상세 보기 →
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
                <div className="xl:hidden">
                  <OmniDetailTimeline medias={medias} />
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="border-b border-zinc-100 px-4 py-3 text-base font-semibold dark:border-zinc-800">
                  매체 목록 ({medias.length})
                </h2>
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {medias.map((m) => (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/medias/${m.id}`}
                          className="font-medium text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                        >
                          {m.mediaName}
                        </Link>
                        <p className="text-xs text-zinc-500">
                          {CATEGORY_KO[m.category] ?? m.category}
                          {m.address ? ` · ${m.address}` : ""}
                        </p>
                      </div>
                      <Link
                        href={`/medias/${m.id}`}
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        상세
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {omniChannel ? (
            <aside className="mt-8 hidden space-y-4 xl:mt-0 xl:block xl:sticky xl:top-24 xl:self-start">
              <OmniDetailTimeline medias={medias} />
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}
