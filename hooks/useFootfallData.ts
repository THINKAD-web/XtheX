"use client";

import { useState, useCallback } from "react";
import type { FootfallResult, FootfallSuggestion } from "@/lib/footfall/types";
import { parseAddressToHotspot } from "@/lib/footfall/address-parser";
import type { HotspotKey } from "@/lib/footfall/fallback-data";

export function useFootfallData() {
  const [result, setResult] = useState<FootfallResult>({
    suggestion: null,
    loading: false,
    error: null,
    matchedArea: null,
  });

  const fetchByAddress = useCallback(
    async (address: string, district?: string | null, city?: string | null) => {
      const trimmed = address?.trim() ?? "";
      if (!trimmed) {
        setResult({
          suggestion: null,
          loading: false,
          error: null,
          matchedArea: null,
        });
        return null;
      }

      setResult((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const params = new URLSearchParams({ address: trimmed });
        if (district?.trim()) params.set("district", district.trim());
        if (city?.trim()) params.set("city", city.trim());
        const res = await fetch(`/api/footfall?${params.toString()}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? res.statusText);
        }
        const body = (await res.json()) as {
          suggestion: FootfallSuggestion;
          matchedArea: HotspotKey | null;
        };
        setResult({
          suggestion: body.suggestion,
          loading: false,
          error: null,
          matchedArea: body.matchedArea,
        });
        return body.suggestion;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "상권 데이터 조회에 실패했습니다.";
        setResult({
          suggestion: null,
          loading: false,
          error: message,
          matchedArea: null,
        });
        return null;
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setResult({
      suggestion: null,
      loading: false,
      error: null,
      matchedArea: null,
    });
  }, []);

  return {
    ...result,
    fetchByAddress,
    clear,
  };
}

export type { FootfallSuggestion, FootfallResult };
