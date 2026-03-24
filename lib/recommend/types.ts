import type { MediaCategory } from "@prisma/client";

/** API·UI 공통 추천 결과 */
export type MediaRecommendationItem = {
  mediaId: string;
  name: string;
  type: MediaCategory;
  location: string;
  score: number;
  estimatedImpressions: number;
  priceEstimate: number;
  isMock?: boolean;
};
