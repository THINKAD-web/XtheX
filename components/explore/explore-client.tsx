"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { APIProvider, Map, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { useInView } from "react-intersection-observer";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

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

type Filters = {
  mediaType: string;
  q: string;
  size: string;
  priceMin: string;
  priceMax: string;
};

const DEFAULT_FILTERS: Filters = {
  mediaType: "ALL",
  q: "",
  size: "",
  priceMin: "",
  priceMax: "",
};

function filtersFromSearchParams(sp: URLSearchParams): Filters {
  const mediaType = sp.get("mediaType") ?? DEFAULT_FILTERS.mediaType;
  const q = sp.get("q") ?? DEFAULT_FILTERS.q;
  const size = sp.get("size") ?? DEFAULT_FILTERS.size;
  const priceMin = sp.get("priceMin") ?? DEFAULT_FILTERS.priceMin;
  const priceMax = sp.get("priceMax") ?? DEFAULT_FILTERS.priceMax;

  return {
    mediaType: mediaType || "ALL",
    q,
    size,
    priceMin,
    priceMax,
  };
}

function buildSearchParamsFromFilters(filters: Filters): URLSearchParams {
  const sp = new URLSearchParams();
  if (filters.mediaType && filters.mediaType !== "ALL") sp.set("mediaType", filters.mediaType);
  if (filters.q.trim()) sp.set("q", filters.q.trim());
  if (filters.size.trim()) sp.set("size", filters.size.trim());
  if (filters.priceMin.trim()) sp.set("priceMin", filters.priceMin.trim());
  if (filters.priceMax.trim()) sp.set("priceMax", filters.priceMax.trim());
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
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("explore");

  const [items, setItems] = React.useState<Item[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Item | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = React.useState<string | null>(null);
  const [mapFocusMarkerId, setMapFocusMarkerId] = React.useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [rawBounds, setRawBounds] = React.useState<Bounds | null>(null);
  const [bounds, setBounds] = React.useState<Bounds | null>(null);
  const [selectedInfoWindow, setSelectedInfoWindow] = React.useState<
    { lat: number; lng: number; item: Item } | null
  >(null);

  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const { ref: lastCardRef, inView } = useInView({
    rootMargin: "200px",
    triggerOnce: false,
  });

  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS); // applied
  const [draftFilters, setDraftFilters] = React.useState<Filters>(DEFAULT_FILTERS); // editing

  const mapCenter = React.useMemo(() => {
    const first = items.map((i) => getLatLng(i.location)).find(Boolean);
    return first ?? { lat: 37.5665, lng: 126.978 }; // Seoul default
  }, [items]);

  // Initialize (and keep in sync) filters from URL
  React.useEffect(() => {
    const next = filtersFromSearchParams(new URLSearchParams(searchParams?.toString() ?? ""));
    setFilters(next);
    setDraftFilters(next);
    setItems([]);
    setNextCursor(null);
  }, [searchParams]);

  const fetchPage = React.useCallback(
    async ({ reset }: { reset: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("take", "20");
        if (!reset && nextCursor) params.set("cursor", nextCursor);
        if (filters.mediaType) params.set("mediaType", filters.mediaType);
        if (filters.q.trim()) params.set("q", filters.q.trim());
        if (filters.size.trim()) params.set("size", filters.size.trim());
        if (filters.priceMin.trim()) params.set("priceMin", filters.priceMin.trim());
        if (filters.priceMax.trim()) params.set("priceMax", filters.priceMax.trim());

        if (bounds) {
          const { sw, ne } = bounds;
          params.set(
            "bounds",
            `${sw.lat},${sw.lng},${ne.lat},${ne.lng}`,
          );
        }

        const res = await fetch(`/api/explore?${params.toString()}`);
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as { items: Item[]; nextCursor: string | null };

        setItems((prev) => (reset ? json.items : [...prev, ...json.items]));
        setNextCursor(json.nextCursor);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [bounds, filters.mediaType, filters.priceMax, filters.priceMin, filters.q, filters.size, nextCursor],
  );

  React.useEffect(() => {
    void fetchPage({ reset: true });
  }, [fetchPage]);

  // Debounce raw bounds → stable bounds (300ms)
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

  // When debounced bounds change, reload from first page
  React.useEffect(() => {
    if (!bounds) return;
    setItems([]);
    setNextCursor(null);
    void fetchPage({ reset: true });
  }, [bounds, fetchPage]);

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

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
          <div>
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <p className="text-sm text-zinc-600">{t("subtitle")}</p>
          </div>

          <div className="space-y-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("search.label")}</label>
              <Input
                placeholder={t("search.placeholder")}
                value={draftFilters.q}
                onChange={(e) => setDraftFilters((f) => ({ ...f, q: e.target.value }))}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("filters.mediaType")}</label>
              <select
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
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
              <label className="text-sm font-medium">{t("filters.size")}</label>
              <Input
                placeholder={t("filters.size_placeholder")}
                value={draftFilters.size}
                onChange={(e) => setDraftFilters((f) => ({ ...f, size: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("filters.priceMin")}</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={draftFilters.priceMin}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, priceMin: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("filters.priceMax")}</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={draftFilters.priceMax}
                  onChange={(e) => setDraftFilters((f) => ({ ...f, priceMax: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={applyFilters} disabled={loading}>
                {t("apply")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetAllFilters();
                }}
                disabled={loading}
              >
                {t("reset")}
              </Button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </aside>

        <main className="space-y-4">
          {/* Active filter chips */}
          <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">
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
                  className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
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
                  className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
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
                  className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
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
                  className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
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
              <span className="text-[11px] text-zinc-400">{t("none")}</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-white p-3">
              {apiKey ? (
                <APIProvider apiKey={apiKey}>
                  <Map
                    defaultCenter={mapCenter}
                    defaultZoom={12}
                    style={{ height: 520, width: "100%" }}
                    gestureHandling="greedy"
                    disableDefaultUI={true}
                    onClick={() => closeMarkerInfo()}
                    // vis.gl passes Google Maps bounds via this callback
                    // We debounce & sync them to the explore API.
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
                        <div className="max-w-xs space-y-1 text-xs text-zinc-900">
                          <p className="font-semibold text-sm">
                            {selectedInfoWindow.item.title}
                          </p>
                          {selectedInfoWindow.item.description ? (
                            <p className="text-zinc-600">
                              {selectedInfoWindow.item.description.slice(0, 50)}
                              {selectedInfoWindow.item.description.length > 50 ? "…" : ""}
                            </p>
                          ) : null}
                          <p className="text-zinc-500">
                            {selectedInfoWindow.item.priceMin != null &&
                            selectedInfoWindow.item.priceMax != null
                              ? `${selectedInfoWindow.item.priceMin.toLocaleString()} ~ ${selectedInfoWindow.item.priceMax.toLocaleString()}`
                              : t("infoWindow.price_empty")}
                          </p>
                          <button
                            type="button"
                            className="pt-1 text-xs font-medium text-blue-600 hover:underline"
                            onClick={() => openItemFromInfoWindow(selectedInfoWindow.item)}
                          >
                            {t("infoWindow.details")}
                          </button>
                        </div>
                      </InfoWindow>
                    ) : null}
                  </Map>
                </APIProvider>
              ) : (
                <div className="flex h-[520px] items-center justify-center text-sm text-zinc-600">
                  {t("map.missing_key")}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-3">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{t("results")}</h2>
                  <p className="text-sm text-zinc-600">{t("loaded", { count: items.length })}</p>
                </div>
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
              </div>

              <div className="mt-3 space-y-3">
                {items.map((item, index) => {
                  const ll = getLatLng(item.location);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      ref={index === items.length - 1 ? lastCardRef : undefined}
                      onClick={() => openItem(item)}
                      className="w-full rounded-lg border border-zinc-200 p-3 text-left hover:bg-zinc-50"
                    >
                      <div className="flex gap-3">
                        <div className="h-16 w-24 flex-shrink-0">
                          <ImageCarousel images={item.images.slice(0, 3)} height={64} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate font-medium">{item.title}</p>
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                              {item.mediaType}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{item.description}</p>
                          <p className="mt-2 text-xs text-zinc-500">
                            {ll?.address ? ll.address : "—"} ·{" "}
                            {item.priceMin != null && item.priceMax != null
                              ? `${item.priceMin.toLocaleString()} ~ ${item.priceMax.toLocaleString()}`
                              : "—"}
                            {item.size ? ` · ${item.size}` : ""}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {items.length === 0 && !loading ? (
                  <div className="py-16 text-center text-sm text-zinc-600">{t("no_results")}</div>
                ) : null}

                {loading && (
                  <div className="py-4 text-center text-xs text-zinc-500">
                    Loading more results...
                  </div>
                )}

                {!loading && items.length > 0 && !nextCursor ? (
                  <div className="py-4 text-center text-xs text-zinc-400">
                    {t("no_more_results")}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>

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
            className="w-full max-w-2xl rounded-lg bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-xl font-semibold">{selected.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{selected.mediaType}</p>
              </div>
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

            <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-800">{selected.description}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-zinc-200 p-3">
                <p className="text-xs text-zinc-500">{t("modal.location")}</p>
                <p className="mt-1">{getLatLng(selected.location)?.address ?? "—"}</p>
              </div>
              <div className="rounded-md border border-zinc-200 p-3">
                <p className="text-xs text-zinc-500">{t("modal.price")}</p>
                <p className="mt-1">
                  {selected.priceMin != null && selected.priceMax != null
                    ? `${selected.priceMin.toLocaleString()} ~ ${selected.priceMax.toLocaleString()}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-md border border-zinc-200 p-3">
                <p className="text-xs text-zinc-500">{t("modal.size")}</p>
                <p className="mt-1">{selected.size ?? "—"}</p>
              </div>
              <div className="rounded-md border border-zinc-200 p-3">
                <p className="text-xs text-zinc-500">{t("modal.images")}</p>
                <p className="mt-1">{t("modal.files", { count: selected.images?.length ?? 0 })}</p>
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
    </div>
  );
}

