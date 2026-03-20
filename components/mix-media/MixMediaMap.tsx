"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { APIProvider, Map, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { MapContainer, TileLayer, useMap as useLeafletMap } from "react-leaflet";
import L from "leaflet";
import { createRoot, type Root } from "react-dom/client";
import { Link } from "@/i18n/navigation";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

export type MixMapMarker = {
  id: string;
  mediaName: string;
  category: string;
  lat: number;
  lng: number;
  address?: string | null;
  cpm?: number | null;
  /** 선택한 조합에 포함된 매체 */
  inSelectedCombo: boolean;
};

const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const SEOUL = { lat: 37.5665, lng: 126.978 };

const CATEGORY_KO: Record<string, string> = {
  BILLBOARD: "빌보드",
  DIGITAL_BOARD: "디지털",
  TRANSIT: "대중교통",
  STREET_FURNITURE: "가로시설",
  WALL: "벽면",
  ETC: "기타",
};

function formatCpm(n: number | null | undefined): string {
  if (n == null || n <= 0) return "—";
  return `${(n / 10000).toFixed(0)}만원 CPM`;
}

function MapColorSchemeSync({ isDark }: { isDark: boolean }) {
  const map = useMap();
  React.useEffect(() => {
    if (!map || typeof window === "undefined" || !window.google?.maps) return;
    const ColorScheme = (window.google.maps as unknown as { ColorScheme?: { DARK: string; LIGHT: string } }).ColorScheme;
    if (!ColorScheme) return;
    map.setOptions({
      colorScheme: isDark ? ColorScheme.DARK : ColorScheme.LIGHT,
    });
  }, [map, isDark]);
  return null;
}

function MixGoogleClustered({
  markers,
  onMarkerClick,
  openInfo,
  onCloseInfo,
}: {
  markers: MixMapMarker[];
  onMarkerClick: (m: MixMapMarker) => void;
  openInfo: MixMapMarker | null;
  onCloseInfo: () => void;
}) {
  const map = useMap();
  const clustererRef = React.useRef<MarkerClusterer | null>(null);

  React.useEffect(() => {
    if (!map || !window.google?.maps) return;

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    if (markers.length === 0) return;

    const googleMarkers = markers.map((m) => {
      const hi = m.inSelectedCombo;
      const baseSize = hi ? 36 : 26;
      const color = hi ? "#ea580c" : "#27272a";
      const stroke = hi ? "#fff7ed" : "#e4e4e7";
      const svg = window.btoa(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${baseSize}" height="${baseSize}" viewBox="0 0 ${baseSize} ${baseSize}">
          <circle cx="${baseSize / 2}" cy="${baseSize / 2}" r="${baseSize / 2 - 2}" fill="${color}" stroke="${stroke}" stroke-width="2"/>
        </svg>`.trim(),
      );
      const marker = new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        title: m.mediaName,
        icon: {
          url: `data:image/svg+xml;base64,${svg}`,
          scaledSize: new window.google.maps.Size(baseSize, baseSize),
        },
        zIndex:
          Number(window.google.maps.Marker.MAX_ZINDEX) + (hi ? 800 : 0),
      });
      marker.addListener("click", () => onMarkerClick(m));
      return marker;
    });

    clustererRef.current = new MarkerClusterer({
      map,
      markers: googleMarkers,
      renderer: {
        render: ({ count, position }) => {
          const size = count < 8 ? 34 : count < 20 ? 42 : 50;
          const fill = "#3f3f46";
          const svg = window.btoa(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
              <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${fill}" stroke="#a1a1aa" stroke-width="1.5"/>
              <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-size="${Math.floor(size / 2.5)}" fill="#fafafa" font-family="system-ui,sans-serif">${count}</text>
            </svg>`.trim(),
          );
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
      clustererRef.current?.clearMarkers();
      clustererRef.current = null;
    };
  }, [map, markers, onMarkerClick]);

  return (
    <>
      {openInfo && (
        <InfoWindow
          position={{ lat: openInfo.lat, lng: openInfo.lng }}
          onCloseClick={onCloseInfo}
        >
          <div className="max-w-[220px] p-1 text-zinc-900">
            <p className="text-sm font-semibold">{openInfo.mediaName}</p>
            <p className="mt-0.5 text-xs text-zinc-600">
              {CATEGORY_KO[openInfo.category] ?? openInfo.category} ·{" "}
              {formatCpm(openInfo.cpm)}
            </p>
            {openInfo.address ? (
              <p className="mt-1 text-xs text-zinc-500">{openInfo.address}</p>
            ) : null}
            <div className="mt-2">
              <Link
                href={`/medias/${openInfo.id}`}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                매체 상세 보기 →
              </Link>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MixGoogleMapInner({
  markers,
  isDark,
}: {
  markers: MixMapMarker[];
  isDark: boolean;
}) {
  const [openInfo, setOpenInfo] = React.useState<MixMapMarker | null>(null);
  const center = React.useMemo(() => {
    if (markers.length === 0) return SEOUL;
    const lat =
      markers.reduce((s, m) => s + m.lat, 0) / markers.length;
    const lng =
      markers.reduce((s, m) => s + m.lng, 0) / markers.length;
    return { lat, lng };
  }, [markers]);

  const onMarkerClick = React.useCallback((m: MixMapMarker) => {
    if ((m as unknown as { _close?: boolean })._close) {
      setOpenInfo(null);
      return;
    }
    setOpenInfo((prev) => (prev?.id === m.id ? null : m));
  }, []);

  React.useEffect(() => {
    setOpenInfo(null);
  }, [markers]);

  return (
    <Map
      defaultCenter={center}
      defaultZoom={markers.length <= 1 ? 13 : 11}
      gestureHandling="greedy"
      disableDefaultUI={false}
      mapId={undefined}
      style={{ width: "100%", height: "100%" }}
    >
      <MapColorSchemeSync isDark={isDark} />
      <MixGoogleClustered
        markers={markers}
        onMarkerClick={onMarkerClick}
        openInfo={openInfo}
        onCloseInfo={() => setOpenInfo(null)}
      />
    </Map>
  );
}

function LeafletClusterLayer({
  markers,
  isDark,
}: {
  markers: MixMapMarker[];
  isDark: boolean;
}) {
  const map = useLeafletMap();
  const rootsRef = React.useRef<Root[]>([]);

  React.useEffect(() => {
    rootsRef.current.forEach((r) => r.unmount());
    rootsRef.current = [];

    type LeafletWithCluster = typeof L & {
      markerClusterGroup: (opts: Record<string, unknown>) => L.LayerGroup;
    };
    const MCG = (L as LeafletWithCluster).markerClusterGroup({
      maxClusterRadius: 52,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: { getChildCount: () => number }) => {
        const n = cluster.getChildCount();
        const size = n < 8 ? 32 : n < 20 ? 40 : 48;
        return L.divIcon({
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${isDark ? "#3f3f46" : "#27272a"};color:#fafafa;display:flex;align-items:center;justify-content:center;font-size:${Math.floor(size / 2.8)}px;font-weight:600;border:2px solid ${isDark ? "#71717a" : "#a1a1aa"}">${n}</div>`,
          className: "mix-mcg-icon",
          iconSize: L.point(size, size),
        });
      },
    });

    for (const m of markers) {
      const hi = m.inSelectedCombo;
      const el = L.divIcon({
        className: "mix-pin",
        html: `<div style="width:${hi ? 22 : 16}px;height:${hi ? 22 : 16}px;border-radius:9999px;background:${hi ? "#ea580c" : "#27272a"};border:2px solid ${hi ? "#fff7ed" : "#e4e4e7"};box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>`,
        iconSize: L.point(hi ? 22 : 16, hi ? 22 : 16),
      });
      const marker = L.marker([m.lat, m.lng], { icon: el });
      const wrap = document.createElement("div");
      wrap.className = "p-2 text-sm min-w-[200px]";
      const root = createRoot(wrap);
      root.render(
        <div className={isDark ? "text-zinc-100" : "text-zinc-900"}>
          <p className="font-semibold">{m.mediaName}</p>
          <p className="mt-0.5 text-xs opacity-80">
            {CATEGORY_KO[m.category] ?? m.category} · {formatCpm(m.cpm)}
          </p>
          {m.address ? (
            <p className="mt-1 text-xs opacity-70">{m.address}</p>
          ) : null}
          <Link
            href={`/medias/${m.id}`}
            className="mt-2 inline-block text-xs font-medium text-blue-500 hover:underline"
          >
            매체 상세 보기 →
          </Link>
        </div>,
      );
      rootsRef.current.push(root);
      marker.bindPopup(wrap, { maxWidth: 260 });
      MCG.addLayer(marker);
    }

    map.addLayer(MCG);
    if (markers.length) {
      const bounds = L.latLngBounds(
        markers.map((x) => [x.lat, x.lng] as [number, number]),
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    return () => {
      map.removeLayer(MCG);
      MCG.clearLayers();
      rootsRef.current.forEach((r) => r.unmount());
      rootsRef.current = [];
    };
  }, [map, markers, isDark]);

  return null;
}

function MixLeafletMap({
  markers,
  isDark,
}: {
  markers: MixMapMarker[];
  isDark: boolean;
}) {
  const center: [number, number] =
    markers.length > 0
      ? [
          markers.reduce((s, m) => s + m.lat, 0) / markers.length,
          markers.reduce((s, m) => s + m.lng, 0) / markers.length,
        ]
      : [SEOUL.lat, SEOUL.lng];

  const tile =
    isDark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={center}
      zoom={11}
      className="z-0 h-[50vh] min-h-[280px] w-full rounded-2xl lg:h-[60vh]"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · CARTO'
        url={tile}
      />
      <LeafletClusterLayer markers={markers} isDark={isDark} />
    </MapContainer>
  );
}

export function MixMediaMap({ markers }: { markers: MixMapMarker[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (markers.length === 0) {
    return (
      <div className="flex h-[50vh] min-h-[280px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400 lg:h-[60vh]">
        위치 좌표가 있는 제안 매체가 없습니다. 매체 등록 시 locationJson에 lat·lng를
        넣어 주세요.
      </div>
    );
  }

  if (mapsKey) {
    return (
      <div className="h-[50vh] min-h-[280px] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 lg:h-[60vh]">
        <APIProvider apiKey={mapsKey} language="ko" region="KR">
          <MixGoogleMapInner markers={markers} isDark={isDark} />
        </APIProvider>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <MixLeafletMap markers={markers} isDark={isDark} />
    </div>
  );
}
