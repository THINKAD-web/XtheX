"use client";

import { useTheme } from "next-themes";
import { useBrightness } from "@/components/brightness/BrightnessPreference";

/**
 * 메인 등 하단 UI: ☀ 밝기(day)이거나 next-themes가 light일 때 밝은 크롬.
 * (시스템 다크 + 테마 다크인데 밝기만 밝게인 경우에도 밝게)
 */
export function useLandingLightChrome(): boolean {
  const { effective } = useBrightness();
  const { resolvedTheme } = useTheme();
  if (effective === "day") return true;
  return resolvedTheme === "light";
}
