"use client";

import * as React from "react";
import type { LatLng } from "@/lib/filters/location-latlng";
import type { Map as LeafletMap } from "leaflet";

type MarkerItem = {
  code: string;
  label: string;
  position: LatLng;
  intensity?: number; // 1..n
  status?: string;
  price?: number | null;
  viewCount?: number;
  updatedAt?: string;
  href?: string;
};

type Props = {
  markers: MarkerItem[];
  className?: string;
};

const SEOUL_CENTER: LatLng = { lat: 37.5665, lng: 126.978 };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPopupHtml(m: MarkerItem): string {
  const lines: string[] = [
    `<div style="font-size:13px;line-height:1.45;color:#18181b">`,
    `<div style="font-weight:600">${escapeHtml(m.label)}</div>`,
    `<div style="font-size:11px;opacity:.72;margin-top:2px">#${escapeHtml(m.code)}</div>`,
  ];
  if (m.status) {
    lines.push(
      `<div style="margin-top:6px;font-size:11px">상태: <strong>${escapeHtml(m.status)}</strong></div>`,
    );
  }
  if (typeof m.price === "number") {
    lines.push(
      `<div style="font-size:11px">가격: ${escapeHtml(String(m.price.toLocaleString()))}원</div>`,
    );
  }
  if (typeof m.viewCount === "number") {
    lines.push(
      `<div style="font-size:11px">조회수: ${escapeHtml(String(m.viewCount.toLocaleString()))}회</div>`,
    );
  }
  if (m.updatedAt) {
    lines.push(
      `<div style="font-size:11px;opacity:.72;margin-top:2px">업데이트: ${escapeHtml(m.updatedAt)}</div>`,
    );
  }
  if (m.href) {
    lines.push(
      `<div style="margin-top:10px">`,
      `<a href="${escapeHtml(m.href)}" style="display:inline-flex;align-items:center;justify-content:center;height:32px;padding:0 12px;border-radius:6px;background:#059669;color:#fff;font-size:12px;font-weight:600;text-decoration:none">상세/편집 열기</a>`,
      `</div>`,
    );
  }
  lines.push(`</div>`);
  return lines.join("");
}

/**
 * react-leaflet MapContainer는 React 18 Strict Mode·동적 import 조합에서
 * 동일 DOM에 Leaflet이 두 번 붙는 경우가 있어, Leaflet만 effect에서 초기화합니다.
 */
export function SeoulMiniMap({ markers, className }: Props) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<LeafletMap | null>(null);

  const markersKey = React.useMemo(
    () =>
      JSON.stringify(
        markers.map((m) => ({
          c: m.code,
          la: m.position.lat,
          ln: m.position.lng,
          l: m.label,
          s: m.status ?? null,
          p: m.price ?? null,
          v: m.viewCount ?? null,
          u: m.updatedAt ?? null,
          h: m.href ?? null,
          i: m.intensity ?? null,
        })),
      ),
    [markers],
  );

  React.useEffect(() => {
    if (markers.length === 0) return;

    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || containerRef.current !== el) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const leafletEl = el as HTMLElement & { _leaflet_id?: number };
      if (leafletEl._leaflet_id != null) {
        el.replaceChildren();
        delete leafletEl._leaflet_id;
      }

      const map = L.map(el, { scrollWheelZoom: false }).setView(
        [SEOUL_CENTER.lat, SEOUL_CENTER.lng],
        11,
      );
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      for (const m of markers) {
        const intensity = clamp(m.intensity ?? 1, 1, 5);
        const radius = 6 + intensity * 2;
        const opacity = 0.35 + intensity * 0.1;
        L.circleMarker([m.position.lat, m.position.lng], {
          radius,
          color: "#f97316",
          fillColor: "#f97316",
          fillOpacity: opacity,
          weight: 2,
        })
          .bindPopup(buildPopupHtml(m))
          .addTo(map);
      }

      requestAnimationFrame(() => {
        if (!cancelled && mapRef.current === map) {
          map.invalidateSize();
        }
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [markers, markersKey]);

  if (markers.length === 0) {
    return (
      <div
        className={
          className ??
          "h-64 w-full overflow-hidden rounded-xl ring-1 ring-zinc-800"
        }
      >
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 text-sm text-zinc-500 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-400">
          아직 지도에 표시할 매체가 없습니다.
        </div>
      </div>
    );
  }

  const shellClass =
    className ?? "h-64 w-full overflow-hidden rounded-xl ring-1 ring-zinc-800";

  return (
    <div className={shellClass}>
      <div
        ref={containerRef}
        className="h-full min-h-[12rem] w-full"
        style={{ minHeight: "12rem" }}
      />
    </div>
  );
}
