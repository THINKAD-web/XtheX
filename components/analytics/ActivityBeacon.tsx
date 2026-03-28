"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const DEDUP_MS = 45_000;

/**
 * 로그인 사용자의 화면 이동을 낮은 빈도로 기록해 관리자 분석에 사용합니다.
 */
export function ActivityBeacon() {
  const { status } = useSession();
  const pathname = usePathname() ?? "";
  const lastRef = useRef<{ path: string; t: number } | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !pathname) return;
    const now = Date.now();
    const prev = lastRef.current;
    if (prev && prev.path === pathname && now - prev.t < DEDUP_MS) return;
    lastRef.current = { path: pathname, t: now };

    void fetch("/api/telemetry/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "PAGE_VIEW",
        category: "NAV",
        meta: { path: pathname },
      }),
    }).catch(() => {
      /* 오프라인 등 무시 */
    });
  }, [pathname, status]);

  return null;
}
