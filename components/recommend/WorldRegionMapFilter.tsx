"use client";

import * as React from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type CountryPoint = {
  code: string;
  label: string;
  lat: number;
  lng: number;
};

const COUNTRY_POINTS: CountryPoint[] = [
  { code: "KR", label: "Korea", lat: 36.5, lng: 127.8 },
  { code: "US", label: "United States", lat: 39.8, lng: -98.6 },
  { code: "JP", label: "Japan", lat: 36.2, lng: 138.2 },
  { code: "CN", label: "China", lat: 35.9, lng: 104.2 },
  { code: "GB", label: "United Kingdom", lat: 55.3, lng: -3.4 },
  { code: "DE", label: "Germany", lat: 51.2, lng: 10.4 },
  { code: "FR", label: "France", lat: 46.2, lng: 2.2 },
  { code: "IT", label: "Italy", lat: 41.9, lng: 12.6 },
  { code: "ES", label: "Spain", lat: 40.4, lng: -3.7 },
  { code: "NL", label: "Netherlands", lat: 52.3, lng: 5.3 },
];

type Props = {
  selectedCodes: string[];
  onToggleCountry: (code: string) => void;
};

export function WorldRegionMapFilter({ selectedCodes, onToggleCountry }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const markersRef = React.useRef<Record<string, LeafletMarker>>({});
  const onToggleRef = React.useRef(onToggleCountry);
  onToggleRef.current = onToggleCountry;

  React.useEffect(() => {
    let cancelled = false;

    void import("leaflet").then((mod) => {
      const L = ((mod as unknown as { default?: typeof mod }).default ??
        mod) as typeof mod;
      if (cancelled) return;
      const el = containerRef.current;
      if (!el) return;

      const markerEl = el as HTMLElement & { _leaflet_id?: number };
      if (markerEl._leaflet_id != null) {
        el.replaceChildren();
        delete markerEl._leaflet_id;
      }

      const map = L.map(el, {
        scrollWheelZoom: false,
        zoomControl: false,
        worldCopyJump: true,
      }).setView([27, 15], 2);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      for (const c of COUNTRY_POINTS) {
        const marker = L.marker([c.lat, c.lng]).addTo(map);
        marker.bindPopup(c.label);
        marker.on("click", () => {
          map.flyTo([c.lat, c.lng], 4, { duration: 0.4 });
          onToggleRef.current(c.code);
        });
        markersRef.current[c.code] = marker;
      }
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = {};
    };
  }, []);

  React.useEffect(() => {
    void import("leaflet").then((mod) => {
      const L = ((mod as unknown as { default?: typeof mod }).default ??
        mod) as typeof mod;
      for (const c of COUNTRY_POINTS) {
        const marker = markersRef.current[c.code];
        if (!marker) continue;
        const isActive = selectedCodes.includes(c.code);
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,.35);background:${
            isActive ? "#2563eb" : "#94a3b8"
          }"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        marker.setIcon(icon);
      }
    });
  }, [selectedCodes]);

  return <div ref={containerRef} className="h-56 w-full rounded-lg border border-zinc-200 dark:border-zinc-700" />;
}
