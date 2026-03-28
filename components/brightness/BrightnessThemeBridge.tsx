"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useBrightness } from "@/components/brightness/BrightnessPreference";

export function BrightnessThemeBridge() {
  const { pref, effective } = useBrightness();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const html = document.documentElement;
    html.classList.add("transitioning");

    if (pref === "bright") {
      setTheme("light");
    } else if (pref === "dim") {
      setTheme("dark");
    } else {
      setTheme(effective === "day" ? "light" : "dark");
    }

    const tid = setTimeout(() => html.classList.remove("transitioning"), 350);
    return () => clearTimeout(tid);
  }, [pref, effective, setTheme]);

  return null;
}
