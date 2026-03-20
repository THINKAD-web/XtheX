"use client";

/**
 * 옴니채널 카트 — 드래그 정렬에 dnd-kit 사용.
 * 패키지: npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
 */

import * as React from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import {
  ShoppingBag,
  Trash2,
  X,
  GripVertical,
  Building2,
  Smartphone,
  TrainFront,
  CarTaxiFront,
  Bus,
  BrickWall,
  Layers,
  CircleHelp,
  Sparkles,
  GitCompare,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useOmniCart } from "@/hooks/useOmniCart";
import { useRouter } from "@/i18n/navigation";
import { toast as sonnerToast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { OmniCartItem, OmniMediaCategory } from "@/lib/omni-cart/types";
import {
  getOmniMediaCategory,
  groupItemsByOmniCategory,
  OMNI_MODAL_GROUP_LABEL_KO,
  orderedOmniCategories,
} from "@/lib/omni-cart/category";
import { OMNI_CART_ADD_FEEDBACK } from "@/lib/omni-cart/types";
import { buildOmniCampaignFlow } from "@/lib/omni-cart/omni-flow";
import { OmniSubmitSuccessModal } from "@/components/omni/OmniSubmitSuccessModal";

const BTN =
  "rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 hover:shadow-lg";

const ACCENT_LINE =
  "bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent";

function ModalGroupIcon({ cat }: { cat: OmniMediaCategory }) {
  const icon =
    "h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-400";
  switch (cat) {
    case "BILLBOARD":
      return <Building2 className={icon} aria-hidden />;
    case "DIGITAL_BOARD":
      return <Smartphone className={icon} aria-hidden />;
    case "TRANSIT":
      return (
        <span className="flex shrink-0 items-center gap-0.5" aria-hidden>
          <TrainFront className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          <CarTaxiFront className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </span>
      );
    case "STREET_FURNITURE":
      return <Bus className={icon} aria-hidden />;
    case "WALL":
      return <BrickWall className={icon} aria-hidden />;
    case "ETC":
      return <Layers className={icon} aria-hidden />;
    default:
      return <CircleHelp className={icon} aria-hidden />;
  }
}

function ItemCategoryIcon({ cat }: { cat: OmniMediaCategory }) {
  const cls = "h-4 w-4 shrink-0 text-muted-foreground";
  switch (cat) {
    case "BILLBOARD":
      return <Building2 className={cls} aria-hidden />;
    case "DIGITAL_BOARD":
      return <Smartphone className={cls} aria-hidden />;
    case "TRANSIT":
      return <TrainFront className={cls} aria-hidden />;
    case "STREET_FURNITURE":
      return <Bus className={cls} aria-hidden />;
    case "WALL":
      return <BrickWall className={cls} aria-hidden />;
    case "ETC":
      return <Layers className={cls} aria-hidden />;
    default:
      return <CircleHelp className={cls} aria-hidden />;
  }
}

function reorderWithinCategory(
  all: OmniCartItem[],
  category: OmniMediaCategory,
  activeId: string,
  overId: string,
): OmniCartItem[] {
  const group = all.filter((i) => getOmniMediaCategory(i) === category);
  const oldI = group.findIndex((i) => i.id === activeId);
  const newI = group.findIndex((i) => i.id === overId);
  if (oldI < 0 || newI < 0) return all;
  const reordered = arrayMove(group, oldI, newI);
  let k = 0;
  return all.map((i) =>
    getOmniMediaCategory(i) === category ? reordered[k++]! : i,
  );
}

function SortableOmniRow({
  item,
  onRemove,
}: {
  item: OmniCartItem;
  onRemove: (id: string) => void;
}) {
  const cat = getOmniMediaCategory(item);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-3 transition-colors hover:bg-muted/50",
        isDragging &&
          "z-10 scale-[1.01] shadow-lg ring-2 ring-cyan-500/40 dark:ring-cyan-400/30",
      )}
    >
      <button
        type="button"
        className="mt-0.5 shrink-0 cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-cyan-600 active:cursor-grabbing dark:hover:text-cyan-400"
        aria-label="순서 변경"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <ItemCategoryIcon cat={cat} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {item.mediaName}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {OMNI_MODAL_GROUP_LABEL_KO[cat]}
          {item.priceMin != null || item.priceMax != null
            ? ` · ${item.priceMin?.toLocaleString() ?? "?"} ~ ${item.priceMax?.toLocaleString() ?? "?"}원`
            : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="제거"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export function OmniCartShell() {
  const {
    items,
    count,
    hydrated,
    remove,
    clear,
    setOrder,
    estimatedFloorKrw,
  } = useOmniCart();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [successCampaignId, setSuccessCampaignId] = React.useState<
    string | null
  >(null);
  const [successModalOpen, setSuccessModalOpen] = React.useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [countBumpSeq, setCountBumpSeq] = React.useState(0);
  const [badgeBounce, setBadgeBounce] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) return;
    const handler = () => {
      setCountBumpSeq((s) => s + 1);
      setBadgeBounce(true);
      window.setTimeout(() => setBadgeBounce(false), 650);
    };
    window.addEventListener(OMNI_CART_ADD_FEEDBACK, handler);
    return () => window.removeEventListener(OMNI_CART_ADD_FEEDBACK, handler);
  }, [hydrated]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const estimatedCeilKrw = React.useMemo(
    () => Math.round(estimatedFloorKrw * 1.4),
    [estimatedFloorKrw],
  );

  const byCategory = React.useMemo(
    () => groupItemsByOmniCategory(items),
    [items],
  );

  const flowLines = React.useMemo(
    () => (items.length ? buildOmniCampaignFlow(items) : null),
    [items],
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const a = active.data.current?.sortable?.containerId as
        | OmniMediaCategory
        | undefined;
      const o = over.data.current?.sortable?.containerId as
        | OmniMediaCategory
        | undefined;
      if (!a || a !== o) return;
      setOrder(
        reorderWithinCategory(
          items,
          a,
          String(active.id),
          String(over.id),
        ),
      );
    },
    [items, setOrder],
  );

  const handleSubmit = async () => {
    if (!items.length) return;
    if (!isSignedIn) {
      sonnerToast.error("로그인이 필요합니다", {
        description: "캠페인으로 제출하려면 로그인해 주세요.",
        duration: 4000,
      });
      return;
    }
    const loadingId = sonnerToast.loading("캠페인 제출 중…");
    setSubmitting(true);
    try {
      const res = await fetch("/api/campaign/omni-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim() || undefined,
          items: items.map((i) => ({
            id: i.id,
            mediaName: i.mediaName,
            category: i.category,
            priceMin: i.priceMin,
            priceMax: i.priceMax,
            source: i.source,
          })),
        }),
      });
      let data: {
        ok?: boolean;
        campaign?: { id: string };
        error?: string;
      };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        sonnerToast.dismiss(loadingId);
        sonnerToast.error("서버 응답을 읽을 수 없습니다", {
          description: "네트워크 또는 서버 오류일 수 있습니다.",
          duration: 5000,
        });
        return;
      }
      sonnerToast.dismiss(loadingId);
      if (!res.ok || !data.ok || !data.campaign?.id) {
        sonnerToast.error("제출 실패", {
          description:
            data.error ??
            (res.status === 400
              ? "매체 정보 형식을 확인해 주세요. (ID는 UUID여야 합니다)"
              : "다시 시도해 주세요."),
          duration: 6000,
        });
        return;
      }
      const newId = data.campaign.id;
      clear();
      setTitle("");
      setOpen(false);
      setSuccessCampaignId(newId);
      setSuccessModalOpen(true);
      sonnerToast.success("옴니채널 캠페인이 생성되었습니다!", {
        duration: 2500,
      });
    } catch {
      sonnerToast.dismiss(loadingId);
      sonnerToast.error("오류가 발생했습니다", {
        description: "네트워크 연결을 확인 후 다시 시도해 주세요.",
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) return null;

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <div
          className={cn(
            "fixed right-4 top-20 z-[85] flex items-center gap-1.5 md:right-6 md:top-24",
          )}
        >
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(BTN, "flex items-center gap-2 pr-5")}
              aria-label={`옴니채널 카트 ${count}개`}
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="max-w-[200px] truncate">옴니채널 카트</span>
            </button>
            {count > 0 ? (
              <span
                className={cn(
                  "absolute -top-2 -right-2 flex min-h-[22px] min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-2 py-1 text-center text-xs font-bold text-white shadow-md shadow-cyan-600/30",
                  badgeBounce && "animate-bounce-once",
                )}
              >
                <motion.span
                  key={countBumpSeq}
                  className="block min-w-[1ch] tabular-nums leading-none"
                  initial={
                    countBumpSeq > 0 ? { scale: 1.3 } : { scale: 1 }
                  }
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 16,
                    mass: 0.6,
                  }}
                >
                  {count}
                </motion.span>
              </span>
            ) : null}
          </div>
          {count >= 5 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-muted/80 text-cyan-600 shadow-sm outline-none transition hover:bg-muted hover:text-cyan-500 dark:text-cyan-400"
                  aria-label="캠페인 구성 안내"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[240px] text-xs">
                최적 옴니채널 캠페인 구성 중이에요! 😎
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </TooltipProvider>

      {open ? (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="omni-cart-title"
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cyan-500/25 bg-background shadow-2xl shadow-cyan-950/25 lg:max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden border-b border-cyan-500/15 bg-gradient-to-r from-cyan-500/12 via-blue-600/10 to-transparent px-5 py-4">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent"
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="omni-cart-title"
                    className={cn("text-xl font-bold tracking-tight", ACCENT_LINE)}
                  >
                    옴니채널 카트
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    미디어 믹스·탐색에서 담은 매체를 한 번에 제출하세요
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 py-14 text-center">
                  <p className="text-sm text-muted-foreground">
                    담긴 매체가 없습니다.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/80">
                    탐색·미디어 믹스에서「옴니채널 담기」를 눌러 보세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/8 to-blue-600/8 px-4 py-3.5 dark:from-cyan-950/40 dark:to-blue-950/30">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      예상 비용
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {estimatedFloorKrw === 0 && estimatedCeilKrw === 0 ? (
                        <span className="text-muted-foreground">
                          단가 미입력 — 협의 후 산정
                        </span>
                      ) : (
                        <>
                          예상 비용:{" "}
                          <span
                            className={cn(
                              "tabular-nums font-bold",
                              ACCENT_LINE,
                            )}
                          >
                            {estimatedFloorKrw.toLocaleString()}원
                          </span>
                          {" ~ "}
                          <span
                            className={cn(
                              "tabular-nums font-bold",
                              ACCENT_LINE,
                            )}
                          >
                            {estimatedCeilKrw.toLocaleString()}원
                          </span>
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      상한은 하한 × 1.4 가정 · 실제는 매체별 협의
                    </p>
                  </div>

                  {flowLines ? (
                    <div className="rounded-xl border border-cyan-500/20 bg-card p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
                        추천 캠페인 흐름
                      </p>
                      <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-foreground">
                        <li className="rounded-lg bg-muted/30 px-3 py-2.5">
                          {(() => {
                            const [a, ...b] = flowLines.week1.split("→");
                            return (
                              <>
                                <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                                  {a?.trim()}
                                </span>
                                {b.length
                                  ? ` → ${b.join("→").trim()}`
                                  : null}
                              </>
                            );
                          })()}
                        </li>
                        <li className="rounded-lg bg-muted/30 px-3 py-2.5">
                          {(() => {
                            const [a, ...b] = flowLines.week2.split("→");
                            return (
                              <>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {a?.trim()}
                                </span>
                                {b.length
                                  ? ` → ${b.join("→").trim()}`
                                  : null}
                              </>
                            );
                          })()}
                        </li>
                      </ul>
                    </div>
                  ) : null}

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="space-y-5">
                      <p className="text-xs text-muted-foreground">
                        <GripVertical className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
                        같은 카테고리 안에서 드래그해 순서를 바꿀 수 있습니다. 변경 시
                        즉시 저장됩니다.
                      </p>
                      {orderedOmniCategories().map((cat) => {
                        const group = byCategory.get(cat) ?? [];
                        if (group.length === 0) return null;
                        return (
                          <div key={cat} className="space-y-2">
                            <div
                              className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-3 font-medium text-primary"
                              id={`omni-group-${cat}`}
                            >
                              <ModalGroupIcon cat={cat} />
                              <span>{OMNI_MODAL_GROUP_LABEL_KO[cat]}</span>
                              <span className="text-sm font-normal text-muted-foreground">
                                {group.length}개
                              </span>
                            </div>
                            <SortableContext
                              id={cat}
                              items={group.map((i) => i.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <ul className="space-y-2 pl-0 sm:pl-1">
                                {group.map((it) => (
                                  <SortableOmniRow
                                    key={it.id}
                                    item={it}
                                    onRemove={remove}
                                  />
                                ))}
                              </ul>
                            </SortableContext>
                          </div>
                        );
                      })}
                    </div>
                  </DndContext>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-cyan-500/15 bg-muted/20 px-5 py-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  캠페인 제목 (선택)
                </label>
                <Input
                  className="mt-1.5 h-11 border-cyan-500/15 focus-visible:ring-cyan-500/30"
                  placeholder="예: 봄 시즌 옴니채널"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {items.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-muted-foreground/30"
                    onClick={() => {
                      if (confirm("카트를 비울까요?")) clear();
                    }}
                  >
                    전체 비우기
                  </Button>
                ) : null}
                {items.length >= 2 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="inline-flex items-center gap-1.5 border-violet-500/40 text-violet-700 hover:bg-violet-500/10 hover:border-violet-500/60 dark:text-violet-300 dark:hover:bg-violet-500/15"
                    onClick={() => {
                      const ids = items.map((i) => i.id).slice(0, 3);
                      setOpen(false);
                      router.push(`/compare?ids=${ids.join(",")}`);
                    }}
                  >
                    <GitCompare className="h-3.5 w-3.5" aria-hidden />
                    이 조합으로 비교하기
                  </Button>
                ) : null}
                <div className="ml-auto flex flex-wrap gap-2">
                  {!isSignedIn ? (
                    <SignInButton mode="modal">
                      <button type="button" className={BTN}>
                        로그인 후 제출
                      </button>
                    </SignInButton>
                  ) : (
                    <button
                      type="button"
                      disabled={items.length === 0 || submitting}
                      className={cn(
                        BTN,
                        "min-w-[160px] disabled:pointer-events-none disabled:opacity-40",
                      )}
                      onClick={() => void handleSubmit()}
                    >
                      {submitting ? "제출 중…" : "캠페인으로 제출"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <OmniSubmitSuccessModal
        open={successModalOpen}
        campaignId={successCampaignId}
        onClose={() => {
          setSuccessModalOpen(false);
          setSuccessCampaignId(null);
        }}
      />
    </>
  );
}
