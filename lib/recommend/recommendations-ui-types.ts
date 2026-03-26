export type RecommendationCurrency = "KRW" | "USD" | "EUR" | "JPY";

export type RecommendationCategory =
  | "Retail"
  | "Transportation"
  | "Entertainment"
  | "Food & Beverage"
  | "Office"
  | "Residential"
  | "Airport";

export type RecommendationGender = "ALL" | "MALE" | "FEMALE";

export type RecommendationAgeBand =
  | "18-24"
  | "25-34"
  | "35-44"
  | "45-54"
  | "55+";

export type RecommendationInterest =
  | "Luxury"
  | "Tech"
  | "Travel"
  | "Gaming"
  | "Food"
  | "Finance"
  | "Sports"
  | "Beauty";

export type RecommendationItem = {
  id: string;
  mediaName: string;
  imageUrl: string;
  city: string;
  country: string;
  globalCountryCode: string;
  aiMatchScore: number; // 0..100
  aiReason: string;
  monthlyPrice: number;
  currency: RecommendationCurrency;
  specSize: string;
  specResolution: string;
  category: RecommendationCategory;
  targetAges: RecommendationAgeBand[];
  targetGender: RecommendationGender;
  interests: RecommendationInterest[];
  updatedAt: string; // ISO string
};

export type RecommendationSort =
  | "score_desc"
  | "price_asc"
  | "updated_desc";

export type RecommendationFilters = {
  countryCodes: string[];
  budgetMin: number;
  budgetMax: number;
  ages: RecommendationAgeBand[];
  genders: RecommendationGender[];
  interests: RecommendationInterest[];
  categories: RecommendationCategory[];
  currency: RecommendationCurrency;
};
