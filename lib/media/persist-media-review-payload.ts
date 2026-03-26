import type { MediaCategory, MediaStatus, Prisma } from "@prisma/client";
import type { MediaReviewFormPayload } from "@/lib/media/media-review-form-payload";
import { mergeAudienceTagsForStorage } from "@/lib/media/audience-tags";

export function toIntOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : Math.round(n);
}

export function validateMediaReviewPayload(
  payload: MediaReviewFormPayload,
): string | null {
  if (!payload.mediaName?.trim()) return "매체명은 필수입니다.";
  const addr = String(payload.locationJson?.address ?? "").trim();
  if (!addr) return "주소는 필수입니다.";
  const lat = Number(payload.locationJson?.lat);
  const lng = Number(payload.locationJson?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return "위도/경도는 필수입니다.";
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return "위도/경도 값 범위를 확인해 주세요.";
  }
  if (payload.price == null || Number(payload.price) <= 0) {
    return "월 가격은 필수입니다.";
  }
  return null;
}

export function buildLocationJsonFromPayload(
  payload: MediaReviewFormPayload,
): Prisma.InputJsonValue {
  return {
    address: payload.locationJson?.address ?? null,
    district: payload.locationJson?.district ?? null,
    city: payload.locationJson?.city ?? null,
    lat: payload.locationJson?.lat ?? null,
    lng: payload.locationJson?.lng ?? null,
    map_link: payload.locationJson?.map_link ?? null,
    width_m: payload.widthM ?? null,
    height_m: payload.heightM ?? null,
    resolution: payload.resolution ?? null,
    operating_hours: payload.operatingHours ?? null,
    sub_category: payload.subCategory ?? null,
  };
}

export function buildExposureJsonFromPayload(
  payload: MediaReviewFormPayload,
): Prisma.InputJsonValue {
  return {
    daily_traffic: payload.dailyFootfall ?? payload.exposureJson?.daily_traffic ?? null,
    weekday_traffic: payload.weekdayFootfall ?? null,
    monthly_impressions:
      payload.impressions ?? payload.exposureJson?.monthly_impressions ?? null,
    reach: payload.reach ?? payload.exposureJson?.reach ?? null,
    frequency: payload.frequency ?? payload.exposureJson?.frequency ?? null,
    cpm: payload.cpm ?? null,
    engagement_rate: payload.engagementRate ?? null,
    visibility_score: payload.visibilityScore ?? null,
    target_age: payload.targetAge ?? null,
    price_note: payload.priceNote ?? null,
  };
}

export function buildParseHistoryReviewV2(
  payload: MediaReviewFormPayload,
): Prisma.InputJsonValue {
  return {
    reviewFormV2: {
      sub_category: payload.subCategory,
      price_note: payload.priceNote,
      effect_memo: payload.effectMemo,
      extracted_images: payload.extractedImages ?? [],
    },
  };
}

/** Shared Prisma write for admin + media owner review forms. */
export function getMediaUpdateDataFromReviewPayload(
  payload: MediaReviewFormPayload,
  status?: MediaStatus,
): Prisma.MediaUpdateInput {
  const exposure = buildExposureJsonFromPayload(payload);
  const audienceTagsMerged = mergeAudienceTagsForStorage(
    payload.targetAudience ?? payload.targetAge,
    payload.audienceTags,
  );
  const base: Prisma.MediaUpdateInput = {
    mediaName: payload.mediaName,
    description: payload.description ?? null,
    category: payload.category as MediaCategory,
    locationJson: buildLocationJsonFromPayload(payload),
    price: toIntOrNull(payload.price),
    cpm: toIntOrNull(payload.cpm),
    exposureJson: exposure,
    targetAudience: payload.targetAudience ?? payload.targetAge ?? null,
    images: (payload.extractedImages ?? payload.images ?? []).slice(0, 10),
    tags: payload.tags ?? [],
    audienceTags: audienceTagsMerged,
    pros: payload.pros ?? payload.effectMemo ?? null,
    cons: payload.cons ?? null,
    trustScore:
      payload.trustScore != null
        ? Math.min(100, Math.max(0, Math.round(payload.trustScore)))
        : null,
    sampleImages: (payload.sampleImages ?? []).slice(0, 10),
    sampleDescriptions: (payload.sampleDescriptions ?? []).slice(0, 10),
    parseHistory: buildParseHistoryReviewV2(payload),
  };
  if (status != null) {
    base.status = status;
  }
  return base;
}

/** Prisma create from review-shaped payload (manual registration). */
export function getMediaCreateDataFromReviewPayload(
  payload: MediaReviewFormPayload,
  status: MediaStatus,
  createdById: string,
): Prisma.MediaCreateInput {
  const u = getMediaUpdateDataFromReviewPayload(payload, status);
  return {
    mediaName: payload.mediaName,
    category: payload.category as MediaCategory,
    description: (u.description ?? null) as string | null,
    locationJson: u.locationJson as Prisma.InputJsonValue,
    price: (u.price ?? null) as number | null,
    cpm: (u.cpm ?? null) as number | null,
    exposureJson: (u.exposureJson ?? undefined) as Prisma.InputJsonValue | undefined,
    targetAudience: (u.targetAudience ?? null) as string | null,
    images: (u.images ?? []) as string[],
    tags: (u.tags ?? []) as string[],
    audienceTags: (u.audienceTags ?? []) as string[],
    pros: (u.pros ?? null) as string | null,
    cons: (u.cons ?? null) as string | null,
    trustScore: (u.trustScore ?? null) as number | null,
    sampleImages: (u.sampleImages ?? []) as string[],
    sampleDescriptions: (u.sampleDescriptions ?? []) as string[],
    parseHistory: (u.parseHistory ?? undefined) as Prisma.InputJsonValue | undefined,
    status,
    createdBy: { connect: { id: createdById } },
    viewCount: 0,
  };
}
