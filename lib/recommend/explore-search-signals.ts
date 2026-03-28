const STORAGE_KEY = "xthex:explore-search-signals:v1";
const MAX_SIGNALS = 24;

export type ExploreSearchSignal = {
  q?: string;
  district?: string;
  mediaType?: string;
  at: number;
};

function readAll(): ExploreSearchSignal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is ExploreSearchSignal =>
        x != null &&
        typeof x === "object" &&
        typeof (x as ExploreSearchSignal).at === "number",
    );
  } catch {
    return [];
  }
}

function writeAll(signals: ExploreSearchSignal[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signals.slice(0, MAX_SIGNALS)));
  } catch {
    // ignore
  }
}

/** 탐색에서 필터 적용 시 호출 */
export function pushExploreSearchSignal(partial: Omit<ExploreSearchSignal, "at">) {
  const q = partial.q?.trim() ?? "";
  const district = partial.district?.trim() ?? "";
  const mediaType = partial.mediaType?.trim() ?? "";
  if (!q && !district && (!mediaType || mediaType === "ALL")) return;

  const next: ExploreSearchSignal = {
    q: q || undefined,
    district: district || undefined,
    mediaType: mediaType && mediaType !== "ALL" ? mediaType : undefined,
    at: Date.now(),
  };

  const prev = readAll().filter((s) => {
    return (
      s.q !== next.q ||
      s.district !== next.district ||
      s.mediaType !== next.mediaType
    );
  });
  writeAll([next, ...prev]);
}

export function getExploreSearchSignalsForApi(): ExploreSearchSignal[] {
  return readAll();
}
