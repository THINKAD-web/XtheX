export const EXPLORE_SEARCH_SIGNALS_STORAGE_KEY = "xthex:explore-search-signals:v1";
const MAX_SIGNALS = 24;

const SIGNALS_CHANGED_EVENT = "xthex-explore-search-signals-changed";

function notifySignalsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SIGNALS_CHANGED_EVENT));
}

/** 같은 탭에서 필터 적용 시 */
export function subscribeToExploreSearchSignalsChanged(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SIGNALS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(SIGNALS_CHANGED_EVENT, listener);
}

export type ExploreSearchSignal = {
  q?: string;
  district?: string;
  mediaType?: string;
  at: number;
};

function readAll(): ExploreSearchSignal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EXPLORE_SEARCH_SIGNALS_STORAGE_KEY);
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
    localStorage.setItem(
      EXPLORE_SEARCH_SIGNALS_STORAGE_KEY,
      JSON.stringify(signals.slice(0, MAX_SIGNALS)),
    );
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
  notifySignalsChanged();
}

export function getExploreSearchSignalsForApi(): ExploreSearchSignal[] {
  return readAll();
}
