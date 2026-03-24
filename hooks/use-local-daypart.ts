"use client";

import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";

/**
 * 히어로·솔리드 스트립용: 밝기(☀) + next-themes 라이트를 함께 반영.
 */
export function useLocalDaypart(): "day" | "night" {
  return useLandingLightChrome() ? "day" : "night";
}
