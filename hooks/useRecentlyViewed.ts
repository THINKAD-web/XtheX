"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "xthex_recently_viewed";
const MAX_ITEMS = 10;

/** Stable empty snapshot for useSyncExternalStore (getSnapshot must not return a new [] each call). Do not mutate. */
const EMPTY_IDS: string[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

let cachedRaw: string | null = "__unread__";
let cachedIds: string[] = EMPTY_IDS;

function emitChange() {
  listeners.forEach((fn) => fn());
}

function getSnapshot(): string[] {
  if (typeof window === "undefined") return EMPTY_IDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedIds;
    cachedRaw = raw;
    if (!raw) {
      cachedIds = EMPTY_IDS;
      return cachedIds;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      cachedIds = EMPTY_IDS;
      return cachedIds;
    }
    cachedIds = parsed as string[];
    return cachedIds;
  } catch {
    cachedRaw = null;
    cachedIds = EMPTY_IDS;
    return cachedIds;
  }
}

function getServerSnapshot(): string[] {
  return EMPTY_IDS;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addRecentlyViewed(mediaId: string) {
  if (typeof window === "undefined" || !mediaId) return;
  try {
    const current = getSnapshot();
    const filtered = current.filter((id) => id !== mediaId);
    const next = [mediaId, ...filtered].slice(0, MAX_ITEMS);
    const nextRaw = JSON.stringify(next);
    localStorage.setItem(STORAGE_KEY, nextRaw);
    cachedRaw = nextRaw;
    cachedIds = next;
    emitChange();
  } catch {
    // localStorage not available
  }
}

export function useRecentlyViewed() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((mediaId: string) => {
    addRecentlyViewed(mediaId);
  }, []);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedIds = EMPTY_IDS;
    emitChange();
  }, []);

  return { ids, add, clear };
}
