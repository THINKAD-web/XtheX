"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { readPendingOnboardingRole } from "@/lib/onboarding/pending-role";
import { useOnboardingRoleIntent } from "@/lib/onboarding/onboarding-role-intent-store";

/**
 * Google OAuth 등으로 가입 시 DB 역할이 기본값일 수 있으므로,
 * 온보딩에서 선택해 둔 역할을 로그인 직후 서버에 반영합니다.
 */
export function PendingRoleAfterAuth() {
  const { status } = useSession();
  const clearStore = useOnboardingRoleIntent((s) => s.clearPendingRole);
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (status !== "authenticated") return;
    const role = readPendingOnboardingRole();
    if (!role || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const res = await fetch("/api/onboarding/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
          credentials: "include",
        });
        if (res.ok) {
          clearStore();
        } else {
          ran.current = false;
        }
      } catch {
        ran.current = false;
      }
    })();
  }, [status, clearStore]);

  return null;
}
