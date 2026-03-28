"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { OFFLINE_SYNC_EVENT } from "@/lib/offline/cache-keys";

type OfflineContextValue = {
  isOnline: boolean;
};

const OfflineContext = React.createContext<OfflineContextValue>({
  isOnline: true,
});

export function useOfflineStatus() {
  return React.useContext(OfflineContext);
}

function dispatchSync() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OFFLINE_SYNC_EVENT));
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("offline");
  const [isOnline, setIsOnline] = React.useState(true);
  const wasOfflineRef = React.useRef(false);

  React.useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);

    const onOffline = () => {
      wasOfflineRef.current = true;
      setIsOnline(false);
    };

    const onOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        toast.success(t("sync_restored"));
      }
      dispatchSync();
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [t]);

  const value = React.useMemo(() => ({ isOnline }), [isOnline]);

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}
