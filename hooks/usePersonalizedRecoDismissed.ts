"use client";

import * as React from "react";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "xthex:personalized-reco-dismissed:v1";
const MAX = 80;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((fn) => fn());
}

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX)));
  } catch {
    // ignore
  }
}

function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function readSerialized(): string {
  return JSON.stringify(read());
}

export function usePersonalizedRecoDismissed() {
  const raw = useSyncExternalStore(subscribe, readSerialized, () => "[]");
  const dismissed = React.useMemo(() => {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  }, [raw]);

  const dismiss = useCallback((mediaId: string) => {
    const cur = read();
    if (cur.includes(mediaId)) return;
    write([mediaId, ...cur]);
    emit();
  }, []);

  return { dismissed, dismiss };
}
