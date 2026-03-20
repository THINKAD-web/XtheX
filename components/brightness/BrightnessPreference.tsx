"use client";

import * as React from "react";

const STORAGE_KEY = "xthex-brightness-pref";

export type BrightnessPref = "auto" | "bright" | "dim";

type Ctx = {
  pref: BrightnessPref;
  /** 실제 표시용: 밝은 UI vs 어두운 UI */
  effective: "day" | "night";
  cycle: () => void;
};

const BrightnessContext = React.createContext<Ctx | null>(null);

function timeBasedPart(): "day" | "night" {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "day" : "night";
}

function nextPref(p: BrightnessPref): BrightnessPref {
  if (p === "auto") return "bright";
  if (p === "bright") return "dim";
  return "auto";
}

export function BrightnessProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pref, setPref] = React.useState<BrightnessPref>("auto");
  const [hydrated, setHydrated] = React.useState(false);
  const [timePart, setTimePart] = React.useState<"day" | "night">("day");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "bright" || raw === "dim" || raw === "auto") {
        setPref(raw);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* ignore */
    }
  }, [pref, hydrated]);

  React.useEffect(() => {
    const tick = () => setTimePart(timeBasedPart());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const effective: "day" | "night" =
    pref === "bright" ? "day" : pref === "dim" ? "night" : timePart;

  const cycle = React.useCallback(() => {
    setPref((p) => nextPref(p));
  }, []);

  const value = React.useMemo(
    () => ({ pref, effective, cycle }),
    [pref, effective, cycle],
  );

  return (
    <BrightnessContext.Provider value={value}>
      {children}
    </BrightnessContext.Provider>
  );
}

export function useBrightness(): Ctx {
  const ctx = React.useContext(BrightnessContext);
  if (!ctx) {
    return {
      pref: "auto",
      effective: typeof window !== "undefined" ? timeBasedPart() : "day",
      cycle: () => {},
    };
  }
  return ctx;
}
