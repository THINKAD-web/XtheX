import type { MediaCategory, MediaStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type MediaReviewRowSerialized = {
  id: string;
  mediaName: string;
  category: MediaCategory;
  status: MediaStatus;
  locationLabel: string;
  ownerLabel: string;
  aiReviewScore: number | null;
  aiReviewComment: string | null;
  dailyExposure: string;
  priceKrw: number | null;
  createdAt: string;
};

function locationFromJson(locationJson: Prisma.JsonValue): string {
  if (!locationJson || typeof locationJson !== "object" || Array.isArray(locationJson)) {
    return "—";
  }
  const o = locationJson as Record<string, unknown>;
  const address = typeof o.address === "string" ? o.address : null;
  const district = typeof o.district === "string" ? o.district : null;
  if (address) return address;
  if (district) return district;
  return "—";
}

function dailyFromExposure(exposureJson: Prisma.JsonValue | null): string {
  if (!exposureJson || typeof exposureJson !== "object" || Array.isArray(exposureJson)) {
    return "—";
  }
  const o = exposureJson as Record<string, unknown>;
  const daily = o.daily_traffic ?? o.daily_impressions;
  if (daily == null) return "—";
  return String(daily);
}

export function serializeMediaReviewRow(m: {
  id: string;
  mediaName: string;
  category: MediaCategory;
  status: MediaStatus;
  locationJson: Prisma.JsonValue;
  exposureJson: Prisma.JsonValue | null;
  price: number | null;
  aiReviewScore: number | null;
  aiReviewComment: string | null;
  createdAt: Date;
  createdBy: { email: string; name: string | null } | null;
}): MediaReviewRowSerialized {
  const owner =
    m.createdBy?.name?.trim() ||
    m.createdBy?.email?.trim() ||
    "—";

  return {
    id: m.id,
    mediaName: m.mediaName,
    category: m.category,
    status: m.status,
    locationLabel: locationFromJson(m.locationJson),
    ownerLabel: owner,
    aiReviewScore: m.aiReviewScore,
    aiReviewComment: m.aiReviewComment,
    dailyExposure: dailyFromExposure(m.exposureJson),
    priceKrw: m.price,
    createdAt: m.createdAt.toISOString(),
  };
}
