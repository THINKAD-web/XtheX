"use client";

import * as React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { LatLng } from "@/lib/filters/location-latlng";
import { Link } from "@/i18n/navigation";

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

const SEOUL_CENTER: LatLng = { lat: 37.5665, lng: 126.9780 };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function SeoulMiniMap({ markers, className }: Props) {
  /** Leaflet은 DOM 컨테이너당 1회만 초기화 가능. Strict Mode + rAF로 한 프레임 뒤에만 MapContainer를 올려 이중 초기화를 피함 */
  const [leafletMountId] = React.useState(
    () =>
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `leaflet-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  );
  const [mapReady, setMapReady] = React.useState(false);

  React.useEffect(() => {
    if (markers.length === 0) {
      setMapReady(false);
      return;
    }
    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      if (!cancelled) setMapReady(true);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      setMapReady(false);
    };
  }, [markers.length]);

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
    <div key={leafletMountId} className={shellClass}>
      {!mapReady ? (
        <div className="h-full min-h-[12rem] w-full animate-pulse bg-zinc-100 dark:bg-zinc-900/80" />
      ) : (
        <MapContainer
          key={leafletMountId}
          center={SEOUL_CENTER}
          zoom={11}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", minHeight: "12rem" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {markers.map((m) => {
            const intensity = clamp(m.intensity ?? 1, 1, 5);
            const radius = 6 + intensity * 2; // 8..16
            const opacity = 0.35 + intensity * 0.1; // 0.45..0.85
            return (
              <CircleMarker
                key={m.code}
                center={m.position}
                radius={radius}
                pathOptions={{
                  color: "#f97316",
                  fillColor: "#f97316",
                  fillOpacity: opacity,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{m.label}</div>
                    <div className="text-xs opacity-70">#{m.code}</div>
                    {m.status ? (
                      <div className="mt-1 text-xs">
                        상태: <span className="font-medium">{m.status}</span>
                      </div>
                    ) : null}
                    {typeof m.price === "number" ? (
                      <div className="text-xs">가격: {m.price.toLocaleString()}원</div>
                    ) : null}
                    {typeof m.viewCount === "number" ? (
                      <div className="text-xs">조회수: {m.viewCount.toLocaleString()}회</div>
                    ) : null}
                    {m.updatedAt ? (
                      <div className="text-xs opacity-70">업데이트: {m.updatedAt}</div>
                    ) : null}
                    {m.href ? (
                      <div className="mt-2">
                        <Link
                          href={m.href}
                          className="inline-flex h-8 items-center justify-center rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          상세/편집 열기
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}

