import type { ExtractedMediaData } from "@/lib/ai/extract-media-from-proposal";
import { mergeAudienceTagsForStorage } from "@/lib/media/audience-tags";

/** 탐색/캐러셀에 쓸 수 있는 실제 URL만 (플레이스홀더 제거) */
export function filterRealImageUrls(images: string[] | undefined): string[] {
  if (!images?.length) return [];
  return images
    .map((s) => String(s).trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

function hasUsableLatLng(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

/**
 * - 이미지: http(s) URL만 유지 (PDF 텍스트에는 사진 파일이 없음 → 문구형 플레이스홀더 제거)
 * - 좌표: 본문에 없으면 주소+Google Geocoding으로 보강 (키 필요, Geocoding API 사용 설정)
 */
function withAudienceTags(data: ExtractedMediaData): ExtractedMediaData {
  return {
    ...data,
    audience_tags: mergeAudienceTagsForStorage(
      data.target_audience,
      data.audience_tags,
    ),
  };
}

export async function enrichExtractedMediaData(
  data: ExtractedMediaData,
): Promise<ExtractedMediaData> {
  const isMockFlow = data.media_name.includes("(MOCK)");
  const images = isMockFlow
    ? (data.images ?? [])
    : filterRealImageUrls(data.images);
  const sampleImages = isMockFlow
    ? (data.sampleImages ?? [])
    : filterRealImageUrls(data.sampleImages ?? []);
  const base = withAudienceTags({
    ...data,
    images,
    sampleImages,
    sampleDescriptions: data.sampleDescriptions ?? [],
  });

  const loc = base.location;
  if (!loc || typeof loc !== "object") {
    return base;
  }

  if (hasUsableLatLng(loc.lat, loc.lng)) {
    return base;
  }

  const addr = [
    loc.address,
    (loc as { city?: string | null }).city,
    loc.district,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!addr) {
    return base;
  }

  const key =
    process.env.GOOGLE_MAPS_GEOCODING_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!key) {
    return base;
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", addr);
    url.searchParams.set("language", "ko");
    url.searchParams.set("region", "kr");
    url.searchParams.set("key", key);
    const res = await fetch(url.toString());
    const json = (await res.json()) as {
      status: string;
      results?: { geometry?: { location?: { lat: number; lng: number } } }[];
    };
    if (json.status !== "OK" || !json.results?.[0]?.geometry?.location) {
      return base;
    }
    const { lat, lng } = json.results[0].geometry.location;
    const mapLink =
      loc.map_link && /^https?:\/\//i.test(String(loc.map_link).trim())
        ? String(loc.map_link)
        : `https://www.google.com/maps?q=${lat},${lng}`;
    return {
      ...base,
      location: {
        ...loc,
        lat,
        lng,
        map_link: mapLink,
      },
    };
  } catch {
    return base;
  }
}
