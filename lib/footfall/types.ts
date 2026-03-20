export type FootfallSuggestion = {
  footfall: number;
  dailyImpressions: number;
  reach: number;
  frequency: number;
  sourceLabel: string;
  sourceUrl?: string;
  isFallback?: boolean;
};

export type FootfallResult = {
  suggestion: FootfallSuggestion | null;
  loading: boolean;
  error: string | null;
  matchedArea: string | null;
};
