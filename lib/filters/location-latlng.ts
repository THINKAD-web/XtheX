export type LatLng = { lat: number; lng: number };

/**
 * location 태그(code) → 서울 중심 POI 좌표 매핑 (low-effort).
 * Advanced Tag code와 일치해야 함.
 */
export const LOCATION_TAG_LATLNG: Record<string, LatLng> = {
  gangnam_station: { lat: 37.4979, lng: 127.0276 },
  coex: { lat: 37.5125, lng: 127.0580 },
  yeouido: { lat: 37.5219, lng: 126.9246 },
  hongdae: { lat: 37.5563, lng: 126.9220 }, // optional future tag
  seoul_station: { lat: 37.5547, lng: 126.9707 }, // optional future tag
};

export function getLatLngForTag(code: string): LatLng | null {
  return LOCATION_TAG_LATLNG[code] ?? null;
}

