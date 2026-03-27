"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { MapPin, LayoutGrid, Map as MapIcon, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InquiryModal } from "@/components/explore/InquiryModal";
import { CompareModal } from "@/components/explore/CompareModal";
import { landing } from "@/lib/landing-theme";
import type { ExploreApiItem } from "@/lib/explore/explore-item";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { usePreferredCurrency } from "@/components/usePreferredCurrency";
import { useOmniCart } from "@/hooks/useOmniCart";
import { exploreMediaTypeToCategory } from "@/lib/omni-cart/category";
import {
  convertCurrency,
  formatCurrency,
  type SupportedCurrency,
} from "@/lib/currency";

const ExploreLeafletMap = dynamic(
  () =>
    import("./ExploreLeafletMap").then((m) => m.ExploreLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[min(70vh,560px)] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    ),
  },
);

type Filters = {
  mediaType: string;
  q: string;
  district: string;
  minTrustScore: string;
  priceMin: string;
  priceMax: string;
  sort: string;
};

const DEFAULT_FILTERS: Filters = {
  mediaType: "ALL",
  q: "",
  district: "",
  minTrustScore: "",
  priceMin: "",
  priceMax: "",
  sort: "createdDesc",
};

function normalizePriceInput(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function filtersFromSearchParams(
  sp: URLSearchParams,
  currency: SupportedCurrency,
): Filters {
  const priceMinKrw = sp.get("priceMin");
  const priceMaxKrw = sp.get("priceMax");
  const priceMinDisplay =
    priceMinKrw && Number.isFinite(Number(priceMinKrw))
      ? String(Math.round(convertCurrency(Number(priceMinKrw), "KRW", currency)))
      : "";
  const priceMaxDisplay =
    priceMaxKrw && Number.isFinite(Number(priceMaxKrw))
      ? String(Math.round(convertCurrency(Number(priceMaxKrw), "KRW", currency)))
      : "";

  return {
    mediaType: sp.get("mediaType") ?? "ALL",
    q: sp.get("q") ?? "",
    district: sp.get("district") ?? "",
    minTrustScore: sp.get("minTrustScore") ?? "",
    priceMin: priceMinDisplay,
    priceMax: priceMaxDisplay,
    sort: sp.get("sort") ?? "createdDesc",
  };
}

function buildSearchParams(
  f: Filters,
  currency: SupportedCurrency,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.mediaType && f.mediaType !== "ALL") sp.set("mediaType", f.mediaType);
  if (f.q.trim()) sp.set("q", f.q.trim());
  if (f.district.trim()) sp.set("district", f.district.trim());
  if (f.minTrustScore.trim()) sp.set("minTrustScore", f.minTrustScore.trim());
  const minInput = normalizePriceInput(f.priceMin);
  const maxInput = normalizePriceInput(f.priceMax);
  if (minInput != null) {
    sp.set("priceMin", String(Math.round(convertCurrency(minInput, currency, "KRW"))));
  }
  if (maxInput != null) {
    sp.set("priceMax", String(Math.round(convertCurrency(maxInput, currency, "KRW"))));
  }
  if (f.sort && f.sort !== DEFAULT_FILTERS.sort) sp.set("sort", f.sort);
  return sp;
}

/** Shared filter query for /api/explore (list pagination vs map bundle). */
function appendExploreFilters(
  p: URLSearchParams,
  f: Filters,
  currency: SupportedCurrency,
) {
  if (f.mediaType && f.mediaType !== "ALL") p.set("mediaType", f.mediaType);
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.district.trim()) p.set("district", f.district.trim());
  if (f.minTrustScore.trim()) p.set("minTrustScore", f.minTrustScore.trim());
  const minInput = normalizePriceInput(f.priceMin);
  const maxInput = normalizePriceInput(f.priceMax);
  if (minInput != null) {
    p.set("priceMin", String(Math.round(convertCurrency(minInput, currency, "KRW"))));
  }
  if (maxInput != null) {
    p.set("priceMax", String(Math.round(convertCurrency(maxInput, currency, "KRW"))));
  }
  if (f.sort && f.sort !== DEFAULT_FILTERS.sort) p.set("sort", f.sort);
}

function getAddress(loc: unknown): string {
  if (!loc || typeof loc !== "object") return "—";
  const o = loc as Record<string, unknown>;
  if (typeof o.address === "string" && o.address.trim()) return o.address;
  if (typeof o.district === "string" && o.district.trim()) return o.district;
  return "—";
}

function isMockMediaId(id: string): boolean {
  return id.startsWith("mock-");
}

type Variant = "public" | "dashboard";

export function ExploreExperience({ variant = "public" }: { variant?: Variant }) {
  const t = useTranslations("explore");
  const tv = useTranslations("explore.v2");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) ?? "ko";
  const preferredCurrency = usePreferredCurrency(locale);
  const { status } = useSession();
  const { add: addToCart } = useOmniCart();

  const [view, setView] = React.useState<"list" | "map">("list");
  const [items, setItems] = React.useState<ExploreApiItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const nextCursorRef = React.useRef<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Filters>(DEFAULT_FILTERS);
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [inquiryItems, setInquiryItems] = React.useState<ExploreApiItem[] | null>(null);
  const [inquiryOpen, setInquiryOpen] = React.useState(false);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [mapItems, setMapItems] = React.useState<ExploreApiItem[]>([]);
  const [mapLoading, setMapLoading] = React.useState(false);
  const [mapError, setMapError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    const next = filtersFromSearchParams(sp, preferredCurrency);
    setDraft(next);
    setFilters(next);
  }, [searchParams, preferredCurrency]);

  React.useEffect(() => {
    let cancelled = false;
    async function load(reset: boolean) {
      setLoading(true);
      setError(null);
      if (reset) {
        nextCursorRef.current = null;
        setNextCursor(null);
        setItems([]);
      }
      try {
        const p = new URLSearchParams();
        p.set("take", "20");
        const cur = reset ? null : nextCursorRef.current;
        if (cur) p.set("cursor", cur);
        appendExploreFilters(p, filters, preferredCurrency);

        const res = await fetch(`/api/explore?${p.toString()}`);
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as {
          items: ExploreApiItem[];
          nextCursor: string | null;
        };
        if (cancelled) return;
        setItems((prev) => (reset ? json.items : [...prev, ...json.items]));
        nextCursorRef.current = json.nextCursor;
        setNextCursor(json.nextCursor);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load(true);
    return () => {
      cancelled = true;
    };
  }, [filters, preferredCurrency]);

  React.useEffect(() => {
    if (view !== "map") return;
    let cancelled = false;
    async function loadMap() {
      setMapLoading(true);
      setMapError(null);
      try {
        const p = new URLSearchParams();
        p.set("take", "500");
        p.set("map", "1");
        appendExploreFilters(p, filters, preferredCurrency);
        const res = await fetch(`/api/explore?${p.toString()}`);
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as { items: ExploreApiItem[] };
        if (cancelled) return;
        setMapItems(json.items);
      } catch (e) {
        if (!cancelled) setMapError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setMapLoading(false);
      }
    }
    void loadMap();
    return () => {
      cancelled = true;
    };
  }, [view, filters, preferredCurrency]);

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams();
      p.set("take", "20");
      p.set("cursor", nextCursorRef.current!);
      appendExploreFilters(p, filters, preferredCurrency);

      const res = await fetch(`/api/explore?${p.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as {
        items: ExploreApiItem[];
        nextCursor: string | null;
      };
      setItems((prev) => [...prev, ...json.items]);
      nextCursorRef.current = json.nextCursor;
      setNextCursor(json.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    const sp = buildSearchParams(draft, preferredCurrency);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function resetFilters() {
    setDraft(DEFAULT_FILTERS);
    router.replace(pathname);
  }

  const dataForSelection = view === "map" ? mapItems : items;
  const selected = dataForSelection.find((i) => i.id === selectedId) ?? null;
  const mapRemountKey = buildSearchParams(filters, preferredCurrency).toString();

  const formatDisplayMoney = React.useCallback(
    (krw: number | null) => {
      if (krw == null) return "—";
      const converted = convertCurrency(krw, "KRW", preferredCurrency);
      return formatCurrency(
        converted,
        preferredCurrency,
        locale === "ko" ? "ko-KR" : "en-US",
      );
    },
    [preferredCurrency, locale],
  );

  function openInquiryMany(list: ExploreApiItem[]) {
    if (list.some((it) => isMockMediaId(it.id))) {
      window.alert(tv("mock_no_inquiry"));
      return;
    }
    setInquiryItems(list);
    setInquiryOpen(true);
  }

  function openInquiry(it: ExploreApiItem) {
    openInquiryMany([it]);
  }

  function toggleSelected(it: ExploreApiItem) {
    setSelectedIds((prev) => {
      const has = prev.includes(it.id);
      if (has) return prev.filter((id) => id !== it.id);
      if (prev.length >= 4) {
        toast.error(tv("compare.max_4"));
        return prev;
      }
      return [...prev, it.id];
    });
  }

  function clearSelected() {
    setSelectedIds([]);
    setCompareOpen(false);
  }

  const shell = variant === "dashboard" ? "pb-16" : "";

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-sky-50/90 via-white to-emerald-50/50 dark:from-zinc-950 dark:via-zinc-950 dark:to-emerald-950/20",
        shell,
      )}
    >
      <div className={cn(landing.container, "py-8 lg:py-12")}>
        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-pretty text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
          {status !== "authenticated" && (
            <p className="text-sm text-blue-700 dark:text-sky-300">
              {tv("guest_banner")}
            </p>
          )}
        </header>

        <div className="mb-6 rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-black/[0.04] dark:border-zinc-700 dark:bg-zinc-900/80 dark:ring-white/[0.06]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t("search.label")}
              </label>
              <Input
                value={draft.q}
                onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
                placeholder={t("search.placeholder")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                {tv("filter_media_type")}
              </label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.mediaType}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, mediaType: e.target.value }))
                }
              >
                <option value="ALL">{tv("filter_all")}</option>
                <option value="BILLBOARD">{locale?.startsWith("ko") ? "대형 광고판" : locale?.startsWith("ja") ? "大型広告板" : locale?.startsWith("zh") ? "大型广告牌" : "Billboards"}</option>
                <option value="DIGITAL_BOARD">{locale?.startsWith("ko") ? "디지털 스크린" : locale?.startsWith("ja") ? "デジタルスクリーン" : locale?.startsWith("zh") ? "数字屏幕" : "Digital Screens"}</option>
                <option value="TRANSIT">{locale?.startsWith("ko") ? "교통 광고" : locale?.startsWith("ja") ? "交通広告" : locale?.startsWith("zh") ? "交通广告" : "Transit Ads"}</option>
                <option value="STREET_FURNITURE">{locale?.startsWith("ko") ? "거리 시설물" : locale?.startsWith("ja") ? "街頭施設" : locale?.startsWith("zh") ? "街道设施" : "Street Installations"}</option>
                <option value="WALL">{locale?.startsWith("ko") ? "벽면 광고" : locale?.startsWith("ja") ? "壁面広告" : locale?.startsWith("zh") ? "墙面广告" : "Wall Ads"}</option>
                <option value="OTHER">{locale?.startsWith("ko") ? "기타" : locale?.startsWith("ja") ? "その他" : locale?.startsWith("zh") ? "其他" : "Others"}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                {tv("filter_region")}
              </label>
              <Input
                value={draft.district}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, district: e.target.value }))
                }
                placeholder={tv("filter_region_ph")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                {tv("filter_min_trust")}
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.minTrustScore}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, minTrustScore: e.target.value }))
                }
                placeholder="0–100"
              />
              <p className="mt-0.5 text-[10px] text-zinc-500">{tv("filter_min_trust_hint")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  {t("filters.priceMin")} ({preferredCurrency})
                </label>
                <Input
                  type="number"
                  value={draft.priceMin}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, priceMin: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  {t("filters.priceMax")} ({preferredCurrency})
                </label>
                <Input
                  type="number"
                  value={draft.priceMax}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, priceMax: e.target.value }))
                  }
                  placeholder="∞"
                />
              </div>
            </div>
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                {tv("sort")}
              </label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.sort}
                onChange={(e) => setDraft((d) => ({ ...d, sort: e.target.value }))}
              >
                <option value="createdDesc">{tv("sort_recent")}</option>
                <option value="priceAsc">{tv("sort_price_asc")}</option>
                <option value="priceDesc">{tv("sort_price_desc")}</option>
                <option value="trustDesc">{tv("sort_reach_desc")}</option>
                <option value="aiDesc">{tv("sort_ai_desc")}</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" onClick={applyFilters} disabled={loading}>
              {t("apply")}
            </Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              {t("reset")}
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                view === "list"
                  ? "bg-blue-600 text-white shadow"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              {tv("tab_list")}
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                view === "map"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
              )}
            >
              <MapIcon className="h-4 w-4" />
              {tv("tab_map")}
            </button>
          </div>
          <p className="text-sm text-zinc-500">
            {t("loaded", {
              count: view === "map" ? mapItems.length : items.length,
            })}
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : null}
        {view === "map" && mapError ? (
          <p className="text-sm text-red-600">{mapError}</p>
        ) : null}

        {view === "list" ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((it) => {
              const isSelected = selectedIds.includes(it.id);
              return (
                <article
                  key={it.id}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md dark:bg-zinc-900",
                    isSelected
                      ? "border-emerald-300 ring-2 ring-emerald-400/40 dark:border-emerald-700"
                      : "border-zinc-200 hover:border-blue-300/60 dark:border-zinc-700",
                  )}
                >
                <div className="relative aspect-[16/10] bg-zinc-100 dark:bg-zinc-800">
                  {it.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.images[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                      No image
                    </div>
                  )}
                  {it.aiReviewScore != null && (
                    <Badge className="absolute right-2 top-2 bg-emerald-600 text-white">
                      AI {it.aiReviewScore}
                    </Badge>
                  )}
                  <label className="absolute left-2 top-2 inline-flex items-center gap-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium text-zinc-800 shadow ring-1 ring-black/5 backdrop-blur dark:bg-zinc-950/80 dark:text-zinc-100 dark:ring-white/10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-emerald-600"
                      checked={isSelected}
                      onChange={() => toggleSelected(it)}
                      aria-label={tv("compare.select")}
                    />
                    {tv("compare.select")}
                  </label>
                  {isSelected ? (
                    <Badge className="absolute left-2 bottom-2 bg-blue-600 text-white">
                      {tv("compare.selected_badge")}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 font-semibold text-zinc-900 dark:text-zinc-50">
                    {it.title}
                  </h3>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
                      {String(it.mediaType)}
                    </Badge>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatDisplayMoney(it.priceMin)}
                    </p>
                  </div>
                  <p className="mt-2 flex items-start gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="line-clamp-2">{getAddress(it.location)}</span>
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide text-zinc-500">
                        {tv("card_daily")}
                      </span>
                      {it.dailyExposure ?? "—"}
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide text-zinc-500">
                        {tv("filter_min_trust")}
                      </span>
                      {it.trustScore != null ? `${it.trustScore}` : "—"}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {status === "authenticated" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                        onClick={() => openInquiry(it)}
                        disabled={isMockMediaId(it.id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        {tv("inquiry_cta")}
                      </Button>
                    ) : (
                      <Link
                        href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                        className={cn(
                          "inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        {tv("login_to_inquire")}
                      </Link>
                    )}
                    <button
                      type="button"
                      className="shrink-0 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-cyan-400 hover:to-blue-500 transition-colors"
                      onClick={() =>
                        addToCart({
                          id: it.id,
                          mediaName: it.title,
                          mediaCategory: exploreMediaTypeToCategory(it.mediaType ?? ""),
                          priceMin: it.priceMin ?? null,
                          priceMax: it.priceMax ?? null,
                          source: "explore",
                        })
                      }
                    >
                      🛒 담기
                    </button>
                    <Link
                      href={`/medias/${it.id}`}
                      className={cn(
                        "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                      )}
                    >
                      {tv("detail")}
                    </Link>
                  </div>
                </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {view === "list" && !loading && items.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {tv("empty_title")}
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {tv("empty_desc")}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" onClick={resetFilters}>
                {t("reset")}
              </Button>
              <Link
                href="/dashboard/media-owner/upload"
                className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500"
              >
                {tv("empty_cta")}
              </Link>
            </div>
          </div>
        ) : null}

        {view === "list" && nextCursor ? (
          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadMore()}
              disabled={loading}
            >
              {loading ? t("loading") : t("load_more")}
            </Button>
          </div>
        ) : null}

        {view === "map" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(280px,340px)]">
            {mapLoading && mapItems.length === 0 ? (
              <div className="h-[min(70vh,560px)] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            ) : (
              <ExploreLeafletMap
                items={mapItems}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onInquiry={(it) => openInquiry(it)}
                remountKey={mapRemountKey}
                currency={preferredCurrency}
                locale={locale}
              />
            )}
            <aside className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {tv("sidebar_title")}
              </h3>
              {selected ? (
                <div className="mt-4 space-y-3 text-sm">
                  <p className="font-medium">{selected.title}</p>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {getAddress(selected.location)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedIds.includes(selected.id) ? "default" : "outline"}
                      onClick={() => toggleSelected(selected)}
                      className={
                        selectedIds.includes(selected.id)
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : undefined
                      }
                    >
                      {selectedIds.includes(selected.id)
                        ? tv("compare.unselect")
                        : tv("compare.select")}
                    </Button>
                    {status === "authenticated" ? (
                      <Button
                        size="sm"
                        onClick={() => openInquiry(selected)}
                        disabled={isMockMediaId(selected.id)}
                      >
                        {tv("inquiry_cta")}
                      </Button>
                    ) : (
                      <Link
                        href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                        className={cn(
                          "inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent",
                        )}
                      >
                        {tv("login_to_inquire")}
                      </Link>
                    )}
                    <Link
                      href={`/medias/${selected.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300"
                    >
                      {tv("detail")}
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">{tv("sidebar_empty")}</p>
              )}
            </aside>
          </div>
        ) : null}

        {loading && items.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">{t("loading")}</p>
        ) : null}
      </div>

      <InquiryModal
        open={inquiryOpen}
        onClose={() => {
          setInquiryOpen(false);
          setInquiryItems(null);
        }}
        medias={inquiryItems}
        locale={locale}
        loginCallbackPath={pathname}
      />

      <CompareModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        items={items.filter((it) => selectedIds.includes(it.id))}
        onInquiry={(it) => openInquiry(it)}
        onBulkInquiry={(list) => openInquiryMany(list)}
        currency={preferredCurrency}
      />

      {view === "list" && selectedIds.length > 0 ? (
        <div className="fixed inset-x-0 bottom-4 z-[90] px-4">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200/70 bg-white/95 p-4 shadow-xl ring-1 ring-emerald-500/10 backdrop-blur dark:border-emerald-900/40 dark:bg-zinc-950/90 dark:ring-emerald-400/10">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {tv("compare.floating_count", { count: selectedIds.length })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => setCompareOpen(true)}
                disabled={selectedIds.length < 2}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {tv("compare.open")}
              </Button>
              <Button type="button" variant="secondary" onClick={clearSelected}>
                {tv("compare.clear")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
