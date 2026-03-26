"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const SESSION_TOAST_KEY = "xthex_media_owner_medias_refresh_toast_shown";

/**
 * 탭 복귀·포커스 시 서버 데이터를 다시 불러와 승인/반려 결과를 목록에 맞춥니다.
 * 안내 토스트는 브라우저 세션당 최대 1회만 표시합니다.
 */
export function MediaOwnerMediasRefreshOnFocus() {
  const router = useRouter();
  const lastNavRefresh = React.useRef(0);

  React.useEffect(() => {
    const run = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastNavRefresh.current < 500) return;
      lastNavRefresh.current = now;
      router.refresh();

      try {
        if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(SESSION_TOAST_KEY)) {
          sessionStorage.setItem(SESSION_TOAST_KEY, "1");
          toast.message("관리자가 최근에 미디어를 처리했을 수 있습니다.", {
            description: "목록이 업데이트되었습니다.",
            duration: 3200,
          });
        }
      } catch {
        /* private mode 등 */
      }
    };

    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", run);
    };
  }, [router]);

  return null;
}
