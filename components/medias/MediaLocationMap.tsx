"use client";

import * as React from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type Props = {
  lat: number;
  lng: number;
  label: string;
};

export function MediaLocationMap({ lat, lng, label }: Props) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const markerRef = React.useRef<LeafletMarker | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void import("leaflet").then((mod) => {
      const L = ((mod as unknown as { default?: typeof mod }).default ??
        mod) as typeof mod;
      if (cancelled) return;

      const el = rootRef.current;
      if (!el) return;
      const leafletEl = el as HTMLElement & { _leaflet_id?: number };
      if (leafletEl._leaflet_id != null) {
        el.replaceChildren();
        delete leafletEl._leaflet_id;
      }

      const map = L.map(el, { scrollWheelZoom: false }).setView([lat, lng], 14);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);
      const marker = L.marker([lat, lng]).addTo(map);
      marker.bindPopup(label);
      markerRef.current = marker;
      requestAnimationFrame(() => map.invalidateSize());
    });

    return () => {
      cancelled = true;
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, label]);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700">
      <div ref={rootRef} className="h-[320px] w-full" />
    </div>
  );
}
