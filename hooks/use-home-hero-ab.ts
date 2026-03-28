"use client";

import * as React from "react";
import { landing } from "@/lib/landing-theme";
import { AB_SLUG_HOME_HERO_CTA } from "@/lib/ab/constants";

const ADVERTISER_OUTLINE =
  "inline-flex h-11 min-w-[200px] items-center justify-center rounded-lg border border-zinc-400 bg-transparent px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/10";

type AssignResponse = { ok?: boolean; variant?: "A" | "B" };

/**
 * 비로그인 히어로 CTAs: 실험 변형에 따라 매체사/광고주 버튼 시각적 우선순위를 바꿉니다.
 */
export function useHomeHeroAb(enabled: boolean) {
  const [variant, setVariant] = React.useState<"A" | "B" | null>(null);

  React.useEffect(() => {
    if (!enabled) {
      setVariant(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/ab/assign?slug=${encodeURIComponent(AB_SLUG_HOME_HERO_CTA)}`,
          { credentials: "include" },
        );
        const data = (await res.json()) as AssignResponse;
        if (!cancelled && data.ok && (data.variant === "A" || data.variant === "B")) {
          setVariant(data.variant);
        } else if (!cancelled) {
          setVariant("A");
        }
      } catch {
        if (!cancelled) setVariant("A");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  React.useEffect(() => {
    if (!enabled || variant == null) return;
    const k = `ab_imp_${AB_SLUG_HOME_HERO_CTA}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
    void fetch("/api/ab/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        slug: AB_SLUG_HOME_HERO_CTA,
        variant,
        type: "IMPRESSION",
      }),
    });
  }, [enabled, variant]);

  const fireConversion = React.useCallback(() => {
    if (!enabled || variant == null) return;
    const k = `ab_conv_${AB_SLUG_HOME_HERO_CTA}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
    void fetch("/api/ab/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        slug: AB_SLUG_HOME_HERO_CTA,
        variant,
        type: "CONVERSION",
      }),
    });
  }, [enabled, variant]);

  const mediaClassName =
    !enabled || variant === null
      ? landing.btnPrimary
      : variant === "A"
        ? landing.btnPrimary
        : ADVERTISER_OUTLINE;

  const advertiserClassName =
    !enabled || variant === null
      ? ADVERTISER_OUTLINE
      : variant === "A"
        ? ADVERTISER_OUTLINE
        : landing.btnPrimary;

  return { mediaClassName, advertiserClassName, fireConversion, variant };
}
