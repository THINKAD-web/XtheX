"use client";

import * as React from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { APIProvider, Map, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { useInView } from "react-intersection-observer";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { OmnichannelPopup } from "@/components/campaign/OmnichannelPopup";
import { useOmniCart } from "@/hooks/useOmniCart";
import { landing } from "@/lib/landing-theme";
import { exploreMediaTypeToCategory } from "@/lib/omni-cart/category";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const exploreSelectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const OMNI_BTN =
  "inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-cyan-600 disabled:pointer-events-none disabled:opacity-40";

/** 매체 비교 — 옴니채널 카트와 동일한 pill/그라데이션 톤 (색만 구분) */
const COMPARE_BTN =
  "inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:from-violet-700 hover:to-fuchsia-700 disabled:pointer-events-none disabled:opacity-40";

/** 패널·카드 베이스 + 메인(Features/FAQ)과 동일한 밝은 크롬 오버라이드 */
const explorePanelBase =
  "rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6 ring-1 ring-black/[0.04] dark:ring-white/[0.08]";

/** 다크 클래스가 남아 있어도 흰 패널 위에서 본문이 보이게 (foreground가 밝은색인 경우 대비) */
const exploreLightChromeText =
  "[&_.text-foreground]:!text-zinc-900 [&_.text-muted-foreground]:!text-zinc-600";

const explorePanelLightChrome =
  "border-zinc-200 bg-white shadow-lg shadow-zinc-200/40 dark:border-zinc-200 dark:bg-white " +
  exploreLightChromeText;

const exploreMediaCardBase =
  "h-full w-full cursor-pointer text-left rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6 transition-[box-shadow,border-color] duration-300 ease-out hover:border-border/80 hover:shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.08]";

const exploreMediaCardLightChrome =
  "border-zinc-200 bg-white shadow-lg shadow-zinc-200/30 dark:border-zinc-200 dark:bg-white " +
  exploreLightChromeText;

type Item = {
  id: string;
  title: string;
  description: string;
  location: any;
  mediaType: string;
  size: string | null;
  priceMin: number | null;
  priceMax: number | null;
  images: string[];
  createdAt: string;
};

function itemToOmni(it: Item) {
  return {
    id: it.id,
    mediaName: it.title,
    category: it.mediaType,
    mediaCategory: exploreMediaTypeToCategory(it.mediaType),
    priceMin: it.priceMin,
    priceMax: it.priceMax,
    source: "explore" as const,
  };
}

type Filters = {
  mediaType: string;
  q: string;
  size: string;
  priceMin: string;
  priceMax: string;
  sort: string;
};

const DEFAULT_FILTERS: Filters = {
  mediaType: "ALL",
  q: "",
  size: "",
  priceMin: "",
  priceMax: "",
  sort: "createdDesc",
};

function filtersFromSearchParams(sp: URLSearchParams): Filters {
  const mediaType = sp.get("mediaType") ?? DEFAULT_FILTERS.mediaType;
  const q = sp.get("q") ?? DEFAULT_FILTERS.q;
  const size = sp.get("size") ?? DEFAULT_FILTERS.size;
  const priceMin = sp.get("priceMin") ?? DEFAULT_FILTERS.priceMin;
  const priceMax = sp.get("priceMax") ?? DEFAULT_FILTERS.priceMax;
  const sort = sp.get("sort") ?? DEFAULT_FILTERS.sort;

  return {
    mediaType: mediaType || "ALL",
    q,
    size,
    priceMin,
    priceMax,
    sort: sort || DEFAULT_FILTERS.sort,
  };
}

function buildSearchParamsFromFilters(filters: Filters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.mediaType && filters.mediaType !== "ALL") sp.set("mediaType", filters.mediaType);
  if (filters.q.trim()) sp.set("q", filters.q.trim());
  if (filters.size.trim()) sp.set("size", filters.size.trim());
  if (filters.priceMin.trim()) sp.set("priceMin", filters.priceMin.trim());
  if (filters.priceMax.trim()) sp.set("priceMax", filters.priceMax.trim());
  if (filters.sort && filters.sort !== DEFAULT_FILTERS.sort) sp.set("sort", filters.sort);
  return sp;
}

function getLatLng(location: any): { lat: number; lng: number; address?: string } | null {
  if (!location || typeof location !== "object") return null;
  const lat = (location as any).lat;
  const lng = (location as any).lng;
  if (typeof lat === "number" && typeof lng === "number") return { lat, lng, address: (location as any).address };
  return null;
}

type MarkerInfo = {
  item: Item;
  ll: { lat: number; lng: number; address?: string };
};

type Bounds = {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
};

function SelectedItemController({
  selectedMarkerId,
  markers,
}: {
  selectedMarkerId: string | null;
  markers: MarkerInfo[];
}) {
  const map = useMap();

  React.useEffect(() => {
    if (!map || !selectedMarkerId) return;
    const target = markers.find((m) => m.item.id === selectedMarkerId);
    if (!target) return;

    const { lat, lng } = target.ll;
    const currentZoom = map.getZoom() ?? 12;
    const nextZoom = Math.min(Math.max(currentZoom + 3, 15), 18);

    // 부드럽게 이동
    if (map.panTo) {
      map.panTo({ lat, lng });
    } else {
      map.setCenter({ lat, lng });
    }
    map.setZoom(nextZoom);
  }, [map, selectedMarkerId, markers]);

  return null;
}

function ClusteredMarkers({
  markers,
  onMarkerClick,
  selectedId,
}: {
  markers: MarkerInfo[];
  onMarkerClick: (item: Item) => void;
  selectedId: string | null;
}) {
  const map = useMap();
  const clustererRef = React.useRef<MarkerClusterer | null>(null);

  React.useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Clean up previous clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    if (markers.length === 0) return;

    const googleMarkers = markers.map(({ item, ll }) => {
      const isSelected = selectedId === item.id;
      const baseSize = 28;
      const size = isSelected ? baseSize * 1.5 : baseSize;

      const color = isSelected ? "#f97316" : "#18181b"; // orange-500 when selected, otherwise zinc-900
      const svg = window.btoa(
        `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(15,23,42,0.35)" />
            </filter>
          </defs>
          <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" filter="url(#shadow)" />
        </svg>
      `.trim(),
      );

      const m = new window.google.maps.Marker({
        position: { lat: ll.lat, lng: ll.lng },
        title: item.title,
        icon: {
          url: `data:image/svg+xml;base64,${svg}`,
          scaledSize: new window.google.maps.Size(size, size),
        },
        zIndex:
          Number(window.google.maps.Marker.MAX_ZINDEX) +
          (isSelected ? 1000 : 0),
      });
      m.addListener("click", () => onMarkerClick(item));
      return m;
    });

    clustererRef.current = new MarkerClusterer({
      map,
      markers: googleMarkers,
      renderer: {
        render: ({ count, position }) => {
          const color = "#18181b"; // zinc-900
          const size =
            count < 10 ? 32 : count < 50 ? 40 : 48;

          const svg = window.btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(15,23,42,0.35)" />
                </filter>
              </defs>
              <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" filter="url(#shadow)" />
              <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="${size / 2.4}" fill="#f4f4f5">
                ${count}
              </text>
            </svg>
          `.trim());

          return new window.google.maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml;base64,${svg}`,
              scaledSize: new window.google.maps.Size(size, size),
            },
            zIndex: Number(window.google.maps.Marker.MAX_ZINDEX) + count,
          });
        },
      },
    });

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
    };
  }, [map, markers, onMarkerClick, selectedId]);

  return null;
}

export function ExploreClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("explore");
  const params = useParams();
  const locale = (params as any)?.locale as string | undefined;
  const isKo = locale === "ko";

  const [items, setItems] = React.useState<Item[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  /** Cursor for "load more" only — must NOT be a fetchPage dependency (would retrigger reset effect). */
  const nextCursorRef = React.useRef<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Item | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = React.useState<string | null>(null);
  const [mapFocusMarkerId, setMapFocusMarkerId] = React.useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [rawBounds, setRawBounds] = React.useState<Bounds | null>(null);
  const [bounds, setBounds] = React.useState<Bounds | null>(null);
  /** false: 전체 공개 매체 조회(기본). true일 때만 API에 bounds 전달 */
  const [filterByMapViewport, setFilterByMapViewport] = React.useState(false);
  const [selectedInfoWindow, setSelectedInfoWindow] = React.useState<
    { lat: number; lng: number; item: Item } | null
  >(null);
  const [mapCollapsed, setMapCollapsed] = React.useState(true);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const boundsRef = React.useRef<Bounds | null>(null);
  boundsRef.current = bounds;
  const { ref: lastCardRef, inView } = useInView({
    rootMargin: "200px",
    triggerOnce: false,
  });

  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS); // applied
  const [draftFilters, setDraftFilters] = React.useState<Filters>(DEFAULT_FILTERS); // editing
  const [compareIds, setCompareIds] = React.useState<string[]>([]);
  const [omnichannelOpen, setOmnichannelOpen] = React.useState(false);
  const [omnichannelMediaIds, setOmnichannelMediaIds] = React.useState<string[]>([]);
  const { add, addMany } = useOmniCart();
  const isLight = useLandingLightChrome();
  const explorePanelClass = cn(explorePanelBase, isLight && explorePanelLightChrome);
  const exploreMediaCardClass = cn(exploreMediaCardBase, isLight && exploreMediaCardLightChrome);

  const centerFromQuery = React.useMemo(() => {
    const center = searchParams?.get("center");
    if (!center) return null;
    const [latStr, lngStr] = center.split(",");
    const lat = Number.parseFloat(latStr);
    const lng = Number.parseFloat(lngStr);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, [searchParams]);

  const zoomFromQuery = React.useMemo(() => {
    const zoom = searchParams?.get("zoom");
    if (!zoom) return null;
    const z = Number.parseInt(zoom, 10);
    return Number.isFinite(z) ? z : null;
  }, [searchParams]);

  const mapCenter = React.useMemo(() => {
    if (centerFromQuery) return centerFromQuery;
    const first = items.map((i) => getLatLng(i.location)).find(Boolean);
    return first ?? { lat: 37.5665, lng: 126.978 }; // Seoul default
  }, [centerFromQuery, items]);

  const initialZoom = zoomFromQuery ?? 12;

  // Initialize (and keep in sync) filters from URL
  React.useEffect(() => {
    const next = filtersFromSearchParams(new URLSearchParams(searchParams?.toString() ?? ""));
    setFilters(next);
    setDraftFilters(next);
    setItems([]);
    setNextCursor(null);
    nextCursorRef.current = null;
  }, [searchParams]);

  const fetchPage = React.useCallback(
    async ({ reset }: { reset: boolean }) => {
      setLoading(true);
      setError(null);
      if (reset) {
        nextCursorRef.current = null;
      }
      try {
        const params = new URLSearchParams();
        params.set("take", "20");
        const cursor = reset ? null : nextCursorRef.current;
        if (cursor) params.set("cursor", cursor);
        if (filters.mediaType) params.set("mediaType", filters.mediaType);
        if (filters.q.trim()) params.set("q", filters.q.trim());
        if (filters.size.trim()) params.set("size", filters.size.trim());
        if (filters.priceMin.trim()) params.set("priceMin", filters.priceMin.trim());
        if (filters.priceMax.trim()) params.set("priceMax", filters.priceMax.trim());
        if (filters.sort && filters.sort !== DEFAULT_FILTERS.sort)
          params.set("sort", filters.sort);

        const b = boundsRef.current;
        if (filterByMapViewport && b) {
          const { sw, ne } = b;
          params.set(
            "bounds",
            `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`,
          );
        }

        const res = await fetch(`/api/explore?${params.toString()}`);
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as { items: Item[]; nextCursor: string | null };

        setItems((prev) => (reset ? json.items : [...prev, ...json.items]));
        nextCursorRef.current = json.nextCursor;
        setNextCursor(json.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [
      filterByMapViewport,
      filters.mediaType,
      filters.priceMax,
      filters.priceMin,
      filters.q,
      filters.size,
      filters.sort,
    ],
  );

  React.useEffect(() => {
    void fetchPage({ reset: true });
  }, [fetchPage]);

  // Debounce raw bounds → stable bounds (지도 영역 필터 켜졌을 때만 API에 사용)
  React.useEffect(() => {
    if (!rawBounds) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setBounds(rawBounds);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [rawBounds]);

  // 지도 영역 필터: 경계 바뀔 때만 다시 로드
  React.useEffect(() => {
    if (!filterByMapViewport || !bounds) return;
    setItems([]);
    setNextCursor(null);
    nextCursorRef.current = null;
    void fetchPage({ reset: true });
  }, [bounds, filterByMapViewport, fetchPage]);

  const prevViewportFilterRef = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    const prev = prevViewportFilterRef.current;
    prevViewportFilterRef.current = filterByMapViewport;
    if (prev === null) return;
    if (prev === filterByMapViewport) return;
    if (!filterByMapViewport) {
      setItems([]);
      setNextCursor(null);
      nextCursorRef.current = null;
      void fetchPage({ reset: true });
    } else if (boundsRef.current) {
      setItems([]);
      setNextCursor(null);
      nextCursorRef.current = null;
      void fetchPage({ reset: true });
    }
  }, [filterByMapViewport, fetchPage]);

  // Infinite scroll: when sentinel comes into view, load next page
  React.useEffect(() => {
    if (!inView) return;
    if (!nextCursor) return;
    if (loading) return;
    void fetchPage({ reset: false });
  }, [inView, nextCursor, loading, fetchPage]);

  function applyFilters() {
    const sp = buildSearchParamsFromFilters(draftFilters);
    const qs = sp.toString();
    router.replace(qs ? `/explore?${qs}` : "/explore");
  }

  function clearAppliedFilter(key: keyof Filters) {
    const next: Filters = { ...filters };
    if (key === "mediaType") next.mediaType = "ALL";
    else next[key] = "";

    const sp = buildSearchParamsFromFilters(next);
    const qs = sp.toString();
    router.replace(qs ? `/explore?${qs}` : "/explore");
  }

  function resetAllFilters() {
    router.replace("/explore");
  }

  const markers = items
    .map((item) => {
      const ll = getLatLng(item.location);
      return ll ? { item, ll } : null;
    })
    .filter(Boolean) as MarkerInfo[];

  // Card click: focus map (pan/zoom) + open modal
  function openItem(item: Item) {
    setSelected(item);
    setSelectedMarkerId(item.id);
    setMapFocusMarkerId(item.id);
  }

  // InfoWindow "details": open modal but do NOT move/zoom map
  function openItemFromInfoWindow(item: Item) {
    setSelected(item);
    setSelectedMarkerId(item.id);
  }

  function openMarkerInfo(item: Item) {
    const ll = getLatLng(item.location);
    setSelectedMarkerId(item.id);
    if (ll) {
      setSelectedInfoWindow({ lat: ll.lat, lng: ll.lng, item });
    } else {
      setSelectedInfoWindow(null);
    }
  }

  function closeMarkerInfo() {
    setSelectedInfoWindow(null);
    // If modal isn't open, also remove marker highlight.
    if (!selected) setSelectedMarkerId(null);
  }

  function goToDetail(item: Item) {
    router.push(`/medias/${item.id}`);
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen",
        isLight ? "bg-gradient-to-b from-zinc-50 to-white" : "bg-background",
      )}
    >
      <section
        className={cn(
          landing.sectionAlt,
          "relative border-t py-20 lg:py-28",
          isLight
            ? "border-zinc-200 bg-gradient-to-b from-zinc-50 to-white"
            : "border-zinc-800/50 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900/40",
        )}
      >
        <div className={landing.container}>
          <div className={landing.sectionStack}>
            <header>
              <h2
                className={cn(
                  "text-3xl font-bold tracking-tight lg:text-4xl",
                  isLight ? "text-zinc-900 dark:text-zinc-900" : "text-foreground",
                )}
              >
                {t("title")}
              </h2>
              <p
                className={cn(
                  "mt-4 max-w-2xl text-pretty text-left text-base leading-relaxed lg:text-lg",
                  isLight ? "text-zinc-600 dark:text-zinc-600" : "text-muted-foreground",
                )}
              >
                {t("subtitle")}
              </p>
            </header>
            <div className="space-y-6 lg:space-y-8">
            <div className={cn("relative", explorePanelClass)}>
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="inline-flex items-center gap-2">
                  <span>현재 {items.length}개 매체</span>
                  {filters.mediaType !== "ALL" && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {filters.mediaType}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                    <input
                      type="checkbox"
                      className="rounded border-input text-foreground"
                      checked={filterByMapViewport}
                      onChange={(e) => setFilterByMapViewport(e.target.checked)}
                    />
                    <span>
                      {isKo
                        ? "지도 안만 검색"
                        : "Filter by map area"}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMapCollapsed((v) => !v)}
                    className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-accent"
                  >
                    {mapCollapsed ? "지도 펼치기" : "지도 접기"}
                  </button>
                </div>
              </div>
              {!mapCollapsed ? (
                <div className="h-[65vh] lg:h-[80vh] overflow-hidden rounded-md border border-border">
                  {true ? (
                    <APIProvider apiKey={mapsKey ?? ""}>
                      <Map
                        defaultCenter={mapCenter}
                        defaultZoom={initialZoom}
                        style={{ height: "100%", width: "100%" }}
                        gestureHandling="greedy"
                        disableDefaultUI={true}
                        onClick={() => closeMarkerInfo()}
                        onBoundsChanged={(ev: any) => {
                          const gBounds = ev?.bounds ?? ev;
                          if (!gBounds || !gBounds.getSouthWest || !gBounds.getNorthEast) return;
                          const sw = gBounds.getSouthWest();
                          const ne = gBounds.getNorthEast();
                          setRawBounds({
                            sw: { lat: sw.lat(), lng: sw.lng() },
                            ne: { lat: ne.lat(), lng: ne.lng() },
                          });
                        }}
                      >
                        <SelectedItemController
                          selectedMarkerId={mapFocusMarkerId}
                          markers={markers}
                        />
                        <ClusteredMarkers
                          markers={markers}
                          onMarkerClick={openMarkerInfo}
                          selectedId={selectedMarkerId}
                        />

                        {selectedInfoWindow ? (
                          <InfoWindow
                            position={{
                              lat: selectedInfoWindow.lat,
                              lng: selectedInfoWindow.lng,
                            }}
                            onCloseClick={closeMarkerInfo}
                          >
                            <div className="max-w-xs space-y-2 text-xs text-foreground">
                              {selectedInfoWindow.item.images?.length ? (
                                <div className="overflow-hidden rounded-md border border-border">
                                  <ImageCarousel
                                    images={selectedInfoWindow.item.images.slice(0, 3)}
                                    height={120}
                                  />
                                </div>
                              ) : null}
                              <div className="space-y-1">
                                <p className="font-semibold text-sm">
                                  {selectedInfoWindow.item.title}
                                </p>
                                {selectedInfoWindow.item.description ? (
                                  <p className="text-muted-foreground">
                                    {selectedInfoWindow.item.description.slice(0, 50)}
                                    {selectedInfoWindow.item.description.length > 50 ? "…" : ""}
                                  </p>
                                ) : null}
                                <p className="text-muted-foreground">
                                  {selectedInfoWindow.item.priceMin != null &&
                                  selectedInfoWindow.item.priceMax != null
                                    ? `${selectedInfoWindow.item.priceMin.toLocaleString()} ~ ${selectedInfoWindow.item.priceMax.toLocaleString()}`
                                    : t("infoWindow.price_empty")}
                                </p>
                                <div className="flex gap-2 pt-2 text-[11px]">
                                  <button
                                    type="button"
                                    className="font-medium text-blue-600 hover:underline"
                                    onClick={() =>
                                      openItemFromInfoWindow(selectedInfoWindow.item)
                                    }
                                  >
                                    미리보기
                                  </button>
                                  <button
                                    type="button"
                                    className="font-medium text-foreground underline-offset-2 hover:underline"
                                    onClick={() => goToDetail(selectedInfoWindow.item)}
                                  >
                                    상세보기
                                  </button>
                                </div>
                              </div>
                            </div>
                          </InfoWindow>
                        ) : null}
                      </Map>
                    </APIProvider>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {t("map.missing_key")}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

          <section className={cn(explorePanelClass, "space-y-4")}>
            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" className="min-w-[140px]" onClick={applyFilters} disabled={loading}>
                {t("apply")}
              </Button>
              <Button type="button" variant="outline" className="min-w-[140px]" onClick={resetAllFilters} disabled={loading}>
                {t("reset")}
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.1fr)] lg:gap-8">
              <div className="grid gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("search.label")}
                </label>
                <Input
                  placeholder={t("search.placeholder")}
                  value={draftFilters.q}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, q: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  {t("filters.mediaType")}
                </label>
                <select
                  className={exploreSelectClass}
                  value={draftFilters.mediaType}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, mediaType: e.target.value }))}
                >
                  <option value="ALL">ALL</option>
                  <option value="BILLBOARD">BILLBOARD</option>
                  <option value="DIGITAL">DIGITAL</option>
                  <option value="TRANSIT">TRANSIT</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  {isKo ? "정렬" : "Sort"}
                </label>
                <select
                  className={exploreSelectClass}
                  value={draftFilters.sort}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, sort: e.target.value }))}
                >
                  <option value="createdDesc">
                    {isKo ? "등록순 (최신)" : "Newest"}
                  </option>
                  <option value="priceAsc">
                    {isKo ? "가격 낮은순" : "Price: low to high"}
                  </option>
                  <option value="priceDesc">
                    {isKo ? "가격 높은순" : "Price: high to low"}
                  </option>
                  <option value="trustDesc">
                    {isKo ? "인기순 (신뢰도)" : "Popular (trust score)"}
                  </option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("filters.priceMin")}
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={draftFilters.priceMin}
                    onChange={(e) => setDraftFilters((f) => ({ ...f, priceMin: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("filters.priceMax")}
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={draftFilters.priceMax}
                    onChange={(e) => setDraftFilters((f) => ({ ...f, priceMax: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
          </section>
          {/* Active filter chips */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {t("active_filters")}
            </span>
            {filters.mediaType !== "ALL" && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 rounded-full px-2 py-0.5"
              >
                {filters.mediaType}
                <button
                  type="button"
                  onClick={() => clearAppliedFilter("mediaType")}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Remove media type filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.size.trim() && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 rounded-full px-2 py-0.5"
              >
                {t("filters.size")}: {filters.size}
                <button
                  type="button"
                  onClick={() => clearAppliedFilter("size")}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Remove size filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(filters.priceMin.trim() || filters.priceMax.trim()) && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 rounded-full px-2 py-0.5"
              >
                {t("filters.price")}:{" "}
                {filters.priceMin.trim()
                  ? Number(filters.priceMin).toLocaleString()
                  : "0"}
                {" ~ "}
                {filters.priceMax.trim()
                  ? Number(filters.priceMax).toLocaleString()
                  : "∞"}
                <button
                  type="button"
                  onClick={() => {
                    clearAppliedFilter("priceMin");
                    clearAppliedFilter("priceMax");
                  }}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Remove price filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.q.trim() && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 rounded-full px-2 py-0.5"
              >
                {t("search.label")}: {filters.q}
                <button
                  type="button"
                  onClick={() => clearAppliedFilter("q")}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Remove search filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {!(
              filters.mediaType !== "ALL" ||
              filters.size.trim() ||
              filters.priceMin.trim() ||
              filters.priceMax.trim() ||
              filters.q.trim()
            ) && (
              <span className="text-[11px] text-muted-foreground">{t("none")}</span>
            )}
          </div>

            <div className={explorePanelClass}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3
                    className={cn(
                      "text-xl font-semibold lg:text-2xl",
                      isLight ? "text-zinc-900 dark:text-zinc-900" : "text-foreground",
                    )}
                  >
                    {t("results")}
                  </h3>
                  <p
                    className={cn(
                      "mt-1 max-w-xl text-pretty text-sm leading-relaxed lg:text-base",
                      isLight ? "text-zinc-600 dark:text-zinc-600" : "text-muted-foreground",
                    )}
                  >
                    {t("loaded", { count: items.length })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void fetchPage({ reset: false })}
                    disabled={loading || !nextCursor}
                  >
                    {nextCursor
                      ? loading
                        ? t("loading")
                        : t("load_more")
                      : t("no_more")}
                  </Button>
                  <button
                    type="button"
                    disabled={compareIds.length < 2}
                    className={COMPARE_BTN}
                    onClick={() => {
                      if (compareIds.length < 2) return;
                      const qs = new URLSearchParams();
                      qs.set("ids", compareIds.join(","));
                      router.push(`/compare?${qs.toString()}`);
                    }}
                  >
                    {compareIds.length >= 2
                      ? t("media_compare_go", { count: compareIds.length })
                      : t("media_compare")}
                  </button>
                  <button
                    type="button"
                    disabled={compareIds.length === 0}
                    className={OMNI_BTN}
                    onClick={() => {
                      if (compareIds.length === 0) return;
                      const list = compareIds.map((id) => {
                        const it = items.find((i) => i.id === id);
                        return it
                          ? itemToOmni(it)
                          : {
                              id,
                              mediaName: `매체 ${id.slice(0, 8)}…`,
                              category: undefined,
                              priceMin: null,
                              priceMax: null,
                              source: "explore" as const,
                            };
                      });
                      addMany(list);
                    }}
                  >
                    {compareIds.length > 0
                      ? t("omni_cart_bulk", { count: compareIds.length })
                      : t("omni_cart")}
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                    disabled={compareIds.length === 0}
                    onClick={() => {
                      if (compareIds.length === 0) return;
                      setOmnichannelMediaIds(compareIds);
                      setOmnichannelOpen(true);
                    }}
                  >
                    {t("campaign_draft")}
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 lg:gap-8">
                {items.map((item, index) => {
                  const ll = getLatLng(item.location);
                  return (
                    <div
                      key={item.id}
                      ref={index === items.length - 1 ? lastCardRef : undefined}
                      onClick={() => openItem(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openItem(item);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={exploreMediaCardClass}
                    >
                      <div className="flex gap-3">
                        <label
                          className="flex flex-shrink-0 cursor-pointer items-start pt-1"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={compareIds.includes(item.id)}
                            onChange={() => toggleCompare(item.id)}
                            className="mt-0.5 h-4 w-4 rounded border-input text-foreground focus:ring-ring"
                            aria-label="비교 목록에 담기"
                          />
                        </label>
                        <div className="h-20 w-28 flex-shrink-0">
                          <ImageCarousel images={item.images.slice(0, 3)} height={80} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate font-medium text-foreground">{item.title}</p>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              {item.mediaType}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                          <p className="mt-2 truncate text-xs text-muted-foreground">
                            {ll?.address ? ll.address : "—"} ·{" "}
                            {item.priceMin != null && item.priceMax != null
                              ? `${item.priceMin.toLocaleString()} ~ ${item.priceMax.toLocaleString()}`
                              : "—"}
                            {item.size ? ` · ${item.size}` : ""}
                          </p>
                          <div
                            className="mt-2 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/medias/${item.id}`);
                              }}
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              상세보기
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && !loading ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    <p>{t("no_results")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      탐색에는 <strong>발행(Published)</strong>된 매체만 보입니다. AI/수동 업로드 직후는 초안(Draft)이라
                      목록에 안 나올 수 있어요 — Admin → 매체에서 발행하거나, 데모 매체를 만들어 보세요.
                    </p>
                  </div>
                ) : null}

                {loading && (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    Loading more results...
                  </div>
                )}

                {!loading && items.length > 0 && !nextCursor ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    {t("no_more_results")}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setSelected(null);
            setSelectedMarkerId(null);
            setMapFocusMarkerId(null);
            setSelectedInfoWindow(null);
          }}
        >
          <div
            className={cn(
              "w-full max-w-2xl rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg",
              isLight &&
                "border-zinc-200 bg-white shadow-lg shadow-zinc-200/40 dark:border-zinc-200 dark:bg-white " +
                  exploreLightChromeText,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-semibold text-foreground">{selected.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{selected.mediaType}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={`${OMNI_BTN} h-9 px-4 text-sm`}
                  onClick={() => {
                    add(itemToOmni(selected));
                  }}
                >
                  {t("omni_cart")}
                </button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-orange-500/60 text-orange-600 hover:bg-orange-500/10"
                  onClick={() => {
                    setOmnichannelMediaIds([selected.id]);
                    setOmnichannelOpen(true);
                  }}
                >
                  {t("campaign_draft")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    router.push(`/medias/${selected.id}`);
                  }}
                >
                  공개 상세보기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelected(null);
                    setSelectedMarkerId(null);
                    setMapFocusMarkerId(null);
                    setSelectedInfoWindow(null);
                  }}
                >
                  {t("modal.close")}
                </Button>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{selected.description}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">{t("modal.location")}</p>
                <p className="mt-1 text-foreground">{getLatLng(selected.location)?.address ?? "—"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">{t("modal.price")}</p>
                <p className="mt-1 text-foreground">
                  {selected.priceMin != null && selected.priceMax != null
                    ? `${selected.priceMin.toLocaleString()} ~ ${selected.priceMax.toLocaleString()}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">{t("modal.size")}</p>
                <p className="mt-1 text-foreground">{selected.size ?? "—"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs text-muted-foreground">{t("modal.images")}</p>
                <p className="mt-1 text-foreground">{t("modal.files", { count: selected.images?.length ?? 0 })}</p>
              </div>
            </div>

            {selected.images?.length ? (
              <div className="mt-4">
                <ImageCarousel
                  images={selected.images}
                  height={220}
                  onClickImage={(index) => setLightboxIndex(index)}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {selected && lightboxIndex != null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageCarousel
              images={selected.images}
              height={480}
              onClickImage={() => setLightboxIndex(null)}
            />
          </div>
        </div>
      ) : null}

      <OmnichannelPopup
        open={omnichannelOpen}
        onClose={() => setOmnichannelOpen(false)}
        mediaIds={omnichannelMediaIds}
        locale={locale ?? "en"}
      />
    </div>
  );
}

