import type { MediaCategory } from "@prisma/client";

export type NaturalLanguageMixParse = {
  target: {
    age_band: string | null;
    gender: string | null;
    lifestyle_notes: string | null;
  };
  /** audienceTags·검색용 (가능하면 canonical: 20대, 여성층, 오피스워커 등) */
  audience_tags: string[];
  budget_krw: number;
  duration_weeks: number;
  location_keywords: string[];
  goal: "awareness" | "traffic" | "sales" | "brand" | string;
  style_notes: string;
  preferred_categories: MediaCategory[];
};

export type MixMediaItem = {
  id: string;
  mediaName: string;
  category: MediaCategory;
  price: number | null;
  cpm: number | null;
  daily_impressions_est: number;
  audienceTags: string[];
  /** locationJson에서 추출, 없으면 null */
  lat: number | null;
  lng: number | null;
  address: string | null;
};

export type MixProposalBreakdown = {
  category: MediaCategory;
  count: number;
  pct: number;
};

export type MixProposal = {
  id: string;
  media_ids: string[];
  medias: MixMediaItem[];
  total_cost_krw: number;
  estimated_reach: number;
  breakdown: MixProposalBreakdown[];
  reasoning_ko: string;
  score: number;
};

export type MixMediaResponse = {
  ok: true;
  parse: NaturalLanguageMixParse;
  proposals: MixProposal[];
  creative_analysis_ko: string | null;
};

export type MixMediaError = {
  ok: false;
  error: string;
};
