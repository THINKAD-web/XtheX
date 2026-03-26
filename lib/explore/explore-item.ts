import type { MediaCategory } from "@prisma/client";

/** /api/explore GET 응답 아이템 (클라이언트 공용) */
export type ExploreApiItem = {
  id: string;
  title: string;
  description: string;
  location: unknown;
  mediaType: MediaCategory | string;
  size: string;
  priceMin: number | null;
  priceMax: number | null;
  trustScore: number | null;
  aiReviewScore: number | null;
  dailyExposure: string | null;
  images: string[];
  createdAt: string;
};
