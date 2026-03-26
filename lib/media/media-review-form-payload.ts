/** Shared payload for admin + media owner media review/edit forms. */
export type MediaReviewFormPayload = {
  mediaName: string;
  description: string | null;
  category: string;
  subCategory: string | null;
  locationJson: {
    address?: string | null;
    district?: string | null;
    city?: string | null;
    lat?: number | null;
    lng?: number | null;
    map_link?: string | null;
  };
  price: number | null;
  priceNote: string | null;
  widthM: number | null;
  heightM: number | null;
  resolution: string | null;
  operatingHours: string | null;
  dailyFootfall: number | null;
  weekdayFootfall: number | null;
  targetAge: string | null;
  impressions: number | null;
  reach: number | null;
  frequency: number | null;
  cpm: number | null;
  engagementRate: number | null;
  visibilityScore: number | null;
  effectMemo: string | null;
  exposureJson: {
    daily_traffic?: number | string | null;
    monthly_impressions?: number | string | null;
    reach?: number | string | null;
    frequency?: number | string | null;
  } | null;
  targetAudience: string | null;
  images: string[];
  tags: string[];
  audienceTags: string[];
  pros: string | null;
  cons: string | null;
  trustScore: number | null;
  sampleImages: string[];
  sampleDescriptions: string[];
  extractedImages: string[];
};
