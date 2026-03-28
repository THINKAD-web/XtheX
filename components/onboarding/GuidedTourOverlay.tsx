"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOUR_SELECTORS, TOUR_STEP_ORDER, tourStorageKey } from "@/lib/guided-tour/config";
import { cn } from "@/lib/utils";

const WELCOME_KEY = "xthex:welcome-modal:v1";

type Rect = { top: number; left: number; width: number; height: number };

/** Viewport-relative box for `position: fixed` overlay children */
function readSpotlightBox(el: Element | null): Rect | null {
  if (!el || !(el instanceof HTMLElement)) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 4 && r.height < 4) return null;
  const pad = 8;
  return {
    top: r.top - pad,
    left: r.left - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

export function GuidedTourOverlay() {
  const { data: session, status } = useSession();
  const t = useTranslations("guided_tour");
  const userId = session?.user?.id?.trim() ?? null;

  const [mounted, setMounted] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [spotlight, setSpotlight] = React.useState<Rect | null>(null);
  const [cardPos, setCardPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const stepId = TOUR_STEP_ORDER[stepIndex] ?? "intro";
  const selector = TOUR_SELECTORS[stepId];

  React.useEffect(() => setMounted(true), []);

  const markDone = React.useCallback(() => {
    if (userId) {
      try {
        window.localStorage.setItem(tourStorageKey(userId), "1");
      } catch {
        // ignore
      }
    }
    setActive(false);
    setStepIndex(0);
    setSpotlight(null);
  }, [userId]);

  const updateLayout = React.useCallback(() => {
    if (!selector) {
      setSpotlight(null);
      setCardPos({
        top: window.innerHeight / 2 - 120,
        left: Math.max(16, window.innerWidth / 2 - 180),
      });
      return;
    }
    const el = document.querySelector(selector);
    const box = readSpotlightBox(el);
    if (!box) {
      setSpotlight(null);
      setCardPos({
        top: window.innerHeight / 2 - 100,
        left: Math.max(16, window.innerWidth / 2 - 180),
      });
      return;
    }
    setSpotlight(box);
    const cardW = 360;
    let left = box.left + box.width / 2 - cardW / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - cardW - 12));
    let top = box.top + box.height + 12;
    if (top > window.innerHeight - 260) {
      top = Math.max(72, box.top - 220);
    }
    setCardPos({ top, left });
  }, [selector]);

  React.useEffect(() => {
    if (!active) return;
    updateLayout();
    const onResize = () => updateLayout();
    const onScroll = () => updateLayout();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [active, stepIndex, updateLayout]);

  React.useEffect(() => {
    if (!active || !selector) return;
    const el = document.querySelector(selector);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [active, selector, stepIndex]);

  const startTour = React.useCallback(
    (mode: "auto" | "manual") => {
      setStepIndex(0);
      setActive(true);
      if (mode === "manual" && userId) {
        try {
          window.localStorage.removeItem(tourStorageKey(userId));
        } catch {
          // ignore
        }
      }
    },
    [userId],
  );

  React.useEffect(() => {
    if (status !== "authenticated" || !userId) return;

    let cancelled = false;

    const maybeAutoStart = () => {
      if (cancelled) return;
      try {
        if (window.localStorage.getItem(tourStorageKey(userId)) === "1") return;
      } catch {
        return;
      }
      startTour("auto");
    };

    let welcomeSeen = false;
    try {
      welcomeSeen = window.localStorage.getItem(WELCOME_KEY) === "1";
    } catch {
      welcomeSeen = false;
    }

    if (welcomeSeen) {
      const timer = window.setTimeout(maybeAutoStart, 700);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    const onWelcomeClosed = () => {
      window.setTimeout(() => {
        if (!cancelled) maybeAutoStart();
      }, 450);
    };
    window.addEventListener("xthex:welcome-closed", onWelcomeClosed);
    return () => {
      cancelled = true;
      window.removeEventListener("xthex:welcome-closed", onWelcomeClosed);
    };
  }, [status, userId, startTour]);

  React.useEffect(() => {
    const onManual = () => {
      if (status !== "authenticated") return;
      startTour("manual");
    };
    window.addEventListener("xthex:start-guided-tour", onManual);
    return () => window.removeEventListener("xthex:start-guided-tour", onManual);
  }, [status, startTour]);

  React.useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") markDone();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, markDone]);

  if (!mounted || !active) return null;

  const isLast = stepIndex >= TOUR_STEP_ORDER.length - 1;
  const title = t(`steps.${stepId}.title` as never);
  const body = t(`steps.${stepId}.body` as never);

  const node = (
    <div className="fixed inset-0 z-[135] pointer-events-auto" role="dialog" aria-modal="true" aria-labelledby="guided-tour-title">
      {/* Dim */}
      <div className="absolute inset-0 bg-black/55" aria-hidden />

      {/* Spotlight cutout */}
      {spotlight && (
        <div
          className="fixed rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ring-2 ring-emerald-400/90 transition-all duration-300"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        />
      )}

      {/* Card */}
      <div
        className={cn(
          "fixed z-[136] w-[min(360px,calc(100vw-24px))] rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-zinc-50 shadow-2xl",
          !spotlight && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        )}
        style={spotlight ? { top: cardPos.top, left: cardPos.left } : undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{t("kicker")}</p>
          <button
            type="button"
            onClick={markDone}
            className="rounded-full border border-zinc-700 p-1 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            aria-label={t("skip")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h2 id="guided-tour-title" className="mt-3 text-lg font-bold leading-snug">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-300">{body}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">
            {stepIndex + 1} / {TOUR_STEP_ORDER.length}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="border-zinc-600" onClick={markDone}>
              {t("skip")}
            </Button>
            {isLast ? (
              <Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={markDone}>
                {t("done")}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setStepIndex((i) => Math.min(TOUR_STEP_ORDER.length - 1, i + 1))}
              >
                {t("next")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
