"use client";

import * as React from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type LeafletModule = typeof import("leaflet");

const DEFAULT_CENTER: [number, number] = [37.5665, 126.978];

function createMarkerIcon(L: LeafletModule) {
  return L.divIcon({
    className: "xthex-leaflet-marker",
    html: '<div style="width:16px;height:16px;border-radius:9999px;background:#14b8a6;border:2px solid #fff;box-shadow:0 2px 8px rgba(20,184,166,.45)"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/**
 * react-leaflet MapContainer는 Strict Mode에서 동일 컨테이너 이중 초기화 오류가 나므로
 * Leaflet만 effect에서 초기화합니다.
 */
export function LeafletLocationPreview({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);
  const markerRef = React.useRef<LeafletMarker | null>(null);
  const leafletModRef = React.useRef<LeafletModule | null>(null);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const [mapReady, setMapReady] = React.useState(false);

  const hasPoint =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    void import("leaflet").then((mod) => {
      const L = (
        (mod as unknown as { default?: LeafletModule }).default ?? mod
      ) as LeafletModule;
      leafletModRef.current = L;
      if (cancelled) return;

      const el = containerRef.current;
      if (!el) return;

      const leafletEl = el as HTMLElement & { _leaflet_id?: number };
      if (leafletEl._leaflet_id != null) {
        el.replaceChildren();
        delete leafletEl._leaflet_id;
      }

      const center: [number, number] = hasPoint ? [lat!, lng!] : DEFAULT_CENTER;
      const zoom = hasPoint ? 14 : 11;

      const map = L.map(el, { scrollWheelZoom: true }).setView(center, zoom);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      map.on("click", (e) => {
        onChangeRef.current(e.latlng.lat, e.latlng.lng);
      });

      const icon = createMarkerIcon(L);

      if (hasPoint) {
        const marker = L.marker([lat!, lng!], { icon, draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          onChangeRef.current(p.lat, p.lng);
        });
        marker.bindPopup("핀을 드래그해 좌표를 수정하세요.");
        markerRef.current = marker;
      }

      requestAnimationFrame(() => {
        if (!cancelled && mapRef.current === map) {
          map.invalidateSize();
        }
      });

      setMapReady(true);
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      leafletModRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 최초 마운트 시점 좌표로만 지도 생성
  }, []);

  // 준비된 뒤 lat/lng 변경 시 마커·뷰만 동기화
  React.useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletModRef.current) return;

    const L = leafletModRef.current;
    const map = mapRef.current;
    const icon = createMarkerIcon(L);

    if (hasPoint) {
      if (markerRef.current) {
        const cur = markerRef.current.getLatLng();
        const same =
          Math.abs(cur.lat - lat!) < 1e-7 && Math.abs(cur.lng - lng!) < 1e-7;
        if (!same) {
          markerRef.current.setLatLng([lat!, lng!]);
          map.setView([lat!, lng!], 14);
        }
      } else {
        const marker = L.marker([lat!, lng!], { icon, draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          onChangeRef.current(p.lat, p.lng);
        });
        marker.bindPopup("핀을 드래그해 좌표를 수정하세요.");
        markerRef.current = marker;
        map.setView([lat!, lng!], 14);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
      map.setView(DEFAULT_CENTER, 11);
    }
  }, [lat, lng, hasPoint, mapReady]);

  if (typeof window === "undefined") return null;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-700">
      <div ref={containerRef} style={{ height: 280, width: "100%" }} />
    </div>
  );
}
