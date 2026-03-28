"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "xthex_recently_viewed";
const MAX_ITEMS = 10;

type Listener = () => void;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((fn) => fn());
}

function getSnapshot(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function getServerSnapshot(): string[] {
  return [];
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
    emitChange();
  }, []);

  return { ids, add, clear };
}
