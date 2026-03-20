/**
 * CPM (원) = (가격 / 일 노출수) * 1000
 */
export function calcCpmFromPriceAndImpressions(
  priceKrw: number | null | undefined,
  dailyImpressions: number | null | undefined,
): number | null {
  if (priceKrw == null || !Number.isFinite(priceKrw) || priceKrw <= 0) return null;
  if (dailyImpressions == null || !Number.isFinite(dailyImpressions) || dailyImpressions <= 0) {
    return null;
  }
  return Math.round((priceKrw / dailyImpressions) * 1000);
}

export function parseExposureNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
