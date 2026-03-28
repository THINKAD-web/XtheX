"use client";

import * as React from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import type { TrendRegionId } from "@/lib/trends/regions";
import { TREND_REGION_POINTS } from "@/lib/trends/regions";

type Props = {
  selectedId: TrendRegionId | null;
  onSelectRegion: (id: TrendRegionId) => void;
  popupLineFor: (id: TrendRegionId) => string;
};

export function TrendsRegionMap({ selectedId, onSelectRegion, popupLineFor }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const markersRef = React.useRef<Partial<Record<TrendRegionId, LeafletMarker>>>({});
  const onSelectRef = React.useRef(onSelectRegion);
  const popupRef = React.useRef(popupLineFor);
  const selectedRef = React.useRef(selectedId);
  onSelectRef.current = onSelectRegion;
  popupRef.current = popupLineFor;
  selectedRef.current = selectedId;

  const [mapReady, setMapReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    void import("leaflet").then((mod) => {
      const L = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod;
      if (cancelled) return;
      const el = containerRef.current;
      if (!el) return;

      const leafletEl = el as HTMLElement & { _leaflet_id?: number };
      if (leafletEl._leaflet_id != null) {
        el.replaceChildren();
        delete leafletEl._leaflet_id;
      }

      const map = L.map(el, {
        scrollWheelZoom: true,
        zoomControl: true,
        worldCopyJump: true,
      }).setView([28, 20], 2);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const mkIcon = (active: boolean) =>
        L.divIcon({
          className: "",
          html: `<div style="width:${active ? 18 : 14}px;height:${active ? 18 : 14}px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,.35);background:${
            active ? "#059669" : "#2563eb"
          }"></div>`,
          iconSize: active ? [22, 22] : [18, 18],
          iconAnchor: active ? [11, 11] : [9, 9],
        });

      for (const p of TREND_REGION_POINTS) {
        const active = selectedRef.current === p.id;
        const marker = L.marker([p.lat, p.lng], { icon: mkIcon(active) }).addTo(map);
        marker.bindPopup(popupRef.current(p.id), { maxWidth: 280 });
        marker.on("click", () => {
          onSelectRef.current(p.id);
          map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 4), { duration: 0.45 });
          marker.openPopup();
        });
        markersRef.current[p.id] = marker;
      }

      requestAnimationFrame(() => map.invalidateSize());
      if (!cancelled) setMapReady(true);
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};
    };
  }, []);

  React.useEffect(() => {
    if (!mapReady) return;
    void import("leaflet").then((mod) => {
      const L = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod;
      const mkIcon = (active: boolean) =>
        L.divIcon({
          className: "",
          html: `<div style="width:${active ? 18 : 14}px;height:${active ? 18 : 14}px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,.35);background:${
            active ? "#059669" : "#2563eb"
          }"></div>`,
          iconSize: active ? [22, 22] : [18, 18],
          iconAnchor: active ? [11, 11] : [9, 9],
        });

      for (const p of TREND_REGION_POINTS) {
        const marker = markersRef.current[p.id];
        if (!marker) continue;
        marker.setIcon(mkIcon(selectedId === p.id));
        marker.setPopupContent(popupLineFor(p.id));
      }
    });
  }, [selectedId, popupLineFor, mapReady]);

  return (
    <div
      ref={containerRef}
      className="z-0 h-[min(62vh,520px)] min-h-[280px] w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
    />
  );
}
