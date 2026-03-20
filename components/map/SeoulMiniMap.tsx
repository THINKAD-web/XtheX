"use client";

import * as React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { LatLng } from "@/lib/filters/location-latlng";

type MarkerItem = {
  code: string;
  label: string;
  position: LatLng;
  intensity?: number; // 1..n
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
  return (
    <div className={className ?? "h-64 w-full overflow-hidden rounded-xl ring-1 ring-zinc-800"}>
      <MapContainer
        center={SEOUL_CENTER}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
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
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

