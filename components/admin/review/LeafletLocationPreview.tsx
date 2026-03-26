"use client";

import * as React from "react";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";

const markerIcon = L.divIcon({
  className: "xthex-leaflet-marker",
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#14b8a6;border:2px solid #fff;box-shadow:0 2px 8px rgba(20,184,166,.45)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function LeafletLocationPreview({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const center = (lat != null && lng != null
    ? [lat, lng]
    : [37.5665, 126.978]) as LatLngExpression;

  if (typeof window === "undefined") return null;

  const ClickHandler = ({
    onPick,
  }: {
    onPick: (lat: number, lng: number) => void;
  }) => {
    useMapEvents({
      click: (e) => onPick(e.latlng.lat, e.latlng.lng),
    });
    return null;
  };

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-700">
      <MapContainer
        center={center}
        zoom={lat != null && lng != null ? 14 : 11}
        style={{ height: 280, width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onPick={onChange} />
        {lat != null && lng != null ? (
          <Marker
            position={[lat, lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target;
                const pos = m.getLatLng();
                onChange(pos.lat, pos.lng);
              },
            }}
          >
            <Popup>핀을 드래그해 좌표를 수정하세요.</Popup>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  );
}
