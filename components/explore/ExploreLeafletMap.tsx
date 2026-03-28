"use client";

import * as React from "react";
import L from "leaflet";
import type { ExploreApiItem } from "@/lib/explore/explore-item";
import { useTranslations } from "next-intl";
import {
  convertCurrency,
  formatCurrency,
  type SupportedCurrency,
} from "@/lib/currency";

/** Leaflet CSS is imported globally in `app/globals.css`. */

const SEOUL = { lat: 37.5665, lng: 126.978 };
const ZOOM_DEFAULT = 11;
const ZOOM_SELECTED = 14;

const OSM_TILE =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

const markerIcon = L.divIcon({
  className: "xthex-leaflet-marker",
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#2563eb;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const markerIconSelected = L.divIcon({
  className: "xthex-leaflet-marker",
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#059669;border:2px solid #fff;box-shadow:0 2px 8px rgba(5,150,105,.45)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function getLatLng(location: unknown): { lat: number; lng: number } | null {
  if (!location || typeof location !== "object") return null;
  const o = location as Record<string, unknown>;
  const lat = o.lat;
  const lng = o.lng;
  if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
  if (typeof lat === "string" && typeof lng === "string") {
    const la = Number(lat);
    const ln = Number(lng);
    if (Number.isFinite(la) && Number.isFinite(ln)) return { lat: la, lng: ln };
  }
  return null;
}

function formatWeeklyPrice(
  it: ExploreApiItem,
  currency: SupportedCurrency,
  locale: string,
): string {
  if (it.priceMin == null) return "—";
  const converted = convertCurrency(it.priceMin, "KRW", currency);
  return formatCurrency(converted, currency, locale === "ko" ? "ko-KR" : "en-US");
}

function buildPopupEl(
  it: ExploreApiItem,
  labels: {
    type: string;
    daily: string;
    weekly: string;
    inquiry: string;
  },
  onInquiry: () => void,
  currency: SupportedCurrency,
  locale: string,
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "max-w-[240px] space-y-2 text-sm text-zinc-900";

  const title = document.createElement("p");
  title.className = "font-semibold leading-snug";
  title.textContent = it.title;

  const meta = document.createElement("div");
  meta.className = "space-y-1 text-xs text-zinc-600";

  const rowType = document.createElement("p");
  const typeLabel = document.createElement("span");
  typeLabel.className = "font-medium text-zinc-500";
  typeLabel.textContent = `${labels.type} `;
  const typeVal = document.createElement("span");
  typeVal.className = "uppercase";
  typeVal.textContent = String(it.mediaType);
  rowType.append(typeLabel, typeVal);

  const rowDaily = document.createElement("p");
  const dailyLabel = document.createElement("span");
  dailyLabel.className = "font-medium text-zinc-500";
  dailyLabel.textContent = `${labels.daily} `;
  const dailyVal = document.createElement("span");
  dailyVal.textContent = it.dailyExposure ?? "—";
  rowDaily.append(dailyLabel, dailyVal);

  const rowWeekly = document.createElement("p");
  const weeklyLabel = document.createElement("span");
  weeklyLabel.className = "font-medium text-zinc-500";
  weeklyLabel.textContent = `${labels.weekly} `;
  const weeklyVal = document.createElement("span");
  weeklyVal.textContent = formatWeeklyPrice(it, currency, locale);
  rowWeekly.append(weeklyLabel, weeklyVal);

  meta.append(rowType, rowDaily, rowWeekly);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700";
  btn.textContent = labels.inquiry;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onInquiry();
  });

  wrap.append(title, meta, btn);
  return wrap;
}

type Props = {
  items: ExploreApiItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onInquiry: (item: ExploreApiItem) => void;
  /** New map instance when filters / dataset identity changes. */
  remountKey: string;
  currency: SupportedCurrency;
  locale: string;
};

/**
 * Imperative Leaflet (no react-leaflet MapContainer) so `map.remove()` always runs
 * on unmount — avoids "Map container is already initialized" with React 18 Strict Mode.
 */
export function ExploreLeafletMap({
  items,
  selectedId,
  onSelect,
  onInquiry,
  remountKey,
  currency,
  locale,
}: Props) {
  const tv = useTranslations("explore.v2");
  const holderRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markersLayerRef = React.useRef<L.LayerGroup | null>(null);
  const onInquiryRef = React.useRef(onInquiry);
  onInquiryRef.current = onInquiry;
  const onSelectRef = React.useRef(onSelect);
  onSelectRef.current = onSelect;

  const labels = React.useMemo(
    () => ({
      type: tv("map_popup_type"),
      daily: tv("map_popup_daily"),
      weekly: tv("map_popup_weekly"),
      inquiry: tv("inquiry_cta"),
    }),
    [tv],
  );

  /**
   * Mount Leaflet on a freshly created child element (never `L.map` twice on the same node).
   * Strict Mode: cleanup removes the child and map; the next run attaches a new child.
   */
  React.useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    const el = document.createElement("div");
    el.className =
      "leaflet-map-pane-host h-full min-h-[min(70vh,560px)] w-full [&_.leaflet-popup-content]:m-3 [&_.leaflet-popup-content]:min-w-[200px]";
    el.setAttribute("aria-label", "Explore map");
    holder.appendChild(el);

    const map = L.map(el, {
      center: [SEOUL.lat, SEOUL.lng],
      zoom: ZOOM_DEFAULT,
      scrollWheelZoom: true,
    });

    L.tileLayer(OSM_TILE, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    const t1 = window.setTimeout(() => map.invalidateSize(), 0);
    const t2 = window.setTimeout(() => map.invalidateSize(), 200);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      if (el.parentNode === holder) holder.removeChild(el);
    };
  }, [remountKey]);

  React.useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const markersData = items
      .map((it) => ({ it, ll: getLatLng(it.location) }))
      .filter(
        (x): x is { it: ExploreApiItem; ll: { lat: number; lng: number } } =>
          x.ll != null,
      );

    for (const { it, ll } of markersData) {
      const icon = it.id === selectedId ? markerIconSelected : markerIcon;
      const m = L.marker([ll.lat, ll.lng], { icon });
      m.on("click", () => onSelectRef.current(it.id));
      const popupEl = buildPopupEl(
        it,
        labels,
        () => onInquiryRef.current(it),
        currency,
        locale,
      );
      m.bindPopup(popupEl, { minWidth: 200, maxWidth: 280 });
      m.addTo(layer);
    }

    if (selectedId) {
      const sel = markersData.find((x) => x.it.id === selectedId);
      if (sel) {
        map.setView([sel.ll.lat, sel.ll.lng], ZOOM_SELECTED, { animate: true });
      }
    }
  }, [items, selectedId, labels, remountKey, currency, locale]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
      <div
        key={remountKey}
        ref={holderRef}
        className="z-0 h-[min(70vh,560px)] w-full"
      />
    </div>
  );
}
