"use client";

import { useBrightness } from "@/components/brightness/BrightnessPreference";

/**
 * 밝기 버튼(자동/밝게/어둡게) + 시간대 반영.
 * @see BrightnessProvider (root layout)
 */
export function useLocalDaypart(): "day" | "night" {
  return useBrightness().effective;
}
