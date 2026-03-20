import type { CreativeHintContext } from "@/lib/hints/creatives";

type ExploreFilters = {
  mediaType: string;
  q: string;
  size: string;
  priceMin: string;
  priceMax: string;
  sort: string;
};

export function buildCreativeContextFromExploreFilters(
  filters: ExploreFilters,
): Pick<CreativeHintContext, "tagCodes" | "targetAudienceText"> {
  const tagCodes: string[] = [];
  const q = (filters.q ?? "").toLowerCase();

  // very cheap heuristics (no DB)
  if (q.includes("직장") || q.includes("commut") || q.includes("office")) {
    tagCodes.push("office_workers");
  }
  if (q.includes("강남") || q.includes("gangnam")) tagCodes.push("gangnam_station");
  if (q.includes("여의도") || q.includes("yeouido")) tagCodes.push("yeouido");
  if (q.includes("코엑스") || q.includes("coex")) tagCodes.push("coex");

  // price range heuristic: high budget -> high_income creative tone
  const max = parseInt((filters.priceMax ?? "").replace(/\D/g, ""), 10);
  if (!Number.isNaN(max) && max >= 100_000_000) {
    tagCodes.push("high_income");
  }

  // media type heuristic
  if ((filters.mediaType ?? "").toUpperCase().includes("DIGITAL")) {
    tagCodes.push("evening_rush");
  }

  return {
    tagCodes: Array.from(new Set(tagCodes)),
    targetAudienceText: filters.q || null,
  };
}

