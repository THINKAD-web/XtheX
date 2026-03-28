"use client";

import * as React from "react";
import { OFFLINE_SYNC_EVENT } from "@/lib/offline/cache-keys";

/** 네트워크 복구 등 `xthex-offline-sync` 시 최신 콜백 실행 */
export function useOfflineSyncEffect(callback: () => void) {
  const ref = React.useRef(callback);
  ref.current = callback;

  React.useEffect(() => {
    const run = () => ref.current();
    window.addEventListener(OFFLINE_SYNC_EVENT, run);
    return () => window.removeEventListener(OFFLINE_SYNC_EVENT, run);
  }, []);
}
