import type { OmniCartItem } from "./types";
import { OMNI_CART_EVENT, OMNI_CART_STORAGE_KEY } from "./types";

function isBrowser() {
  return typeof window !== "undefined";
}

export function readOmniCart(): OmniCartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(OMNI_CART_STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (x): x is OmniCartItem =>
        x &&
        typeof x === "object" &&
        typeof (x as OmniCartItem).id === "string" &&
        typeof (x as OmniCartItem).mediaName === "string",
    );
  } catch {
    return [];
  }
}

export function writeOmniCart(items: OmniCartItem[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(OMNI_CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(OMNI_CART_EVENT));
  } catch {
    /* ignore quota */
  }
}

export function addToOmniCart(item: OmniCartItem): OmniCartItem[] {
  const prev = readOmniCart();
  if (prev.some((p) => p.id === item.id)) return prev;
  const next = [...prev, item];
  writeOmniCart(next);
  return next;
}

export function addManyToOmniCart(items: OmniCartItem[]): OmniCartItem[] {
  const byId = new Map<string, OmniCartItem>();
  for (const p of readOmniCart()) byId.set(p.id, p);
  for (const it of items) byId.set(it.id, it);
  const next = [...byId.values()];
  writeOmniCart(next);
  return next;
}

export function removeFromOmniCart(mediaId: string): OmniCartItem[] {
  const next = readOmniCart().filter((p) => p.id !== mediaId);
  writeOmniCart(next);
  return next;
}

export function clearOmniCart(): void {
  writeOmniCart([]);
}

export function setOmniCartItems(items: OmniCartItem[]): void {
  writeOmniCart(items);
}

export function subscribeOmniCart(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onCustom = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === OMNI_CART_STORAGE_KEY) cb();
  };
  window.addEventListener(OMNI_CART_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(OMNI_CART_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

/** 합계: priceMin 우선, 없으면 priceMax, 둘 다 없으면 0 */
export function estimateOmniCartFloorKrw(items: OmniCartItem[]): number {
  return items.reduce((s, it) => {
    const v =
      it.priceMin != null
        ? it.priceMin
        : it.priceMax != null
          ? it.priceMax
          : 0;
    return s + Math.max(0, v);
  }, 0);
}
