"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useBrightness } from "@/components/brightness/BrightnessPreference";

/**
 * 밝기(자동/밝게/어둡게)를 next-themes와 동기화해
 * 모든 페이지의 `dark:` 변형·CSS 변수가 같은 기준을 따르게 함.
 */
export function BrightnessThemeBridge() {
  const { pref, effective } = useBrightness();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    if (pref === "bright") {
      setTheme("light");
      return;
    }
    if (pref === "dim") {
      setTheme("dark");
      return;
    }
    setTheme(effective === "day" ? "light" : "dark");
  }, [pref, effective, setTheme]);

  return null;
}
