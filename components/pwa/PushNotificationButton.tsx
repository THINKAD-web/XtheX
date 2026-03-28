"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

export function PushNotificationButton() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PermissionState);

      if (result === "granted") {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        }).catch(() => null);

        if (subscription) {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription.toJSON()),
          }).catch(() => {
            /* placeholder – API not yet implemented */
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  if (permission === "unsupported") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <BellOff className="h-5 w-5 shrink-0 text-zinc-400" />
        <div>
          <p className="text-sm font-medium">푸시 알림</p>
          <p className="text-xs text-muted-foreground">
            이 브라우저에서는 푸시 알림을 지원하지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
        <BellRing className="h-5 w-5 shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            푸시 알림 활성화됨
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            새로운 문의, 캠페인 업데이트 등을 알림으로 받습니다.
          </p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <BellOff className="h-5 w-5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            푸시 알림 차단됨
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            브라우저 설정에서 알림 권한을 허용해 주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={requestPermission}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-left transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-orange-500" />
      ) : (
        <Bell className="h-5 w-5 shrink-0 text-orange-500" />
      )}
      <div>
        <p className="text-sm font-medium">푸시 알림 허용</p>
        <p className="text-xs text-muted-foreground">
          새 문의·캠페인 업데이트를 실시간으로 받아보세요.
        </p>
      </div>
    </button>
  );
}
