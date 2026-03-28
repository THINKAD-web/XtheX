import type { Media, MediaCategory, MediaStatus, CurrencyCode } from "@prisma/client";

export type PartnerMediaDto = {
  id: string;
  mediaName: string;
  category: MediaCategory;
  status: MediaStatus;
  updatedAt: string;
  createdAt: string;
  globalCountryCode: string | null;
  price: number | null;
  currency: CurrencyCode;
  trustScore: number | null;
  viewCount: number;
  imageCount: number;
  location: {
    address?: string;
    lat?: number;
    lng?: number;
  };
};

export function toPartnerMediaDto(m: Media): PartnerMediaDto {
  const loc = (m.locationJson ?? {}) as Record<string, unknown>;
  const address = typeof loc.address === "string" ? loc.address : undefined;
  const lat = typeof loc.lat === "number" ? loc.lat : undefined;
  const lng = typeof loc.lng === "number" ? loc.lng : undefined;
  return {
    id: m.id,
    mediaName: m.mediaName,
    category: m.category,
    status: m.status,
    updatedAt: m.updatedAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
    globalCountryCode: m.globalCountryCode,
    price: m.price,
    currency: m.currency,
    trustScore: m.trustScore,
    viewCount: m.viewCount,
    imageCount: (m.images ?? []).length,
    location: { address, lat, lng },
  };
}
