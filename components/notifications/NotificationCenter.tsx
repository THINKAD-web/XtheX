"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useOfflineSyncEffect } from "@/components/offline/useOfflineSyncEffect";
import { OFFLINE_CACHE } from "@/lib/offline/cache-keys";
import { offlineCacheGet, offlineCachePut } from "@/lib/offline/indexed-cache";
import { cn } from "@/lib/utils";

type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
  starred?: boolean;
};

type NotificationsCachePayload = {
  notifications: NotificationRow[];
  unreadCount: number;
};

function formatTimeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const sec = Math.floor((Date.now() - then) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

function truncateMessage(text: string, max = 80): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export function NotificationCenter() {
  const t = useTranslations("notificationCenter");
  const tOff = useTranslations("offline");
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [marking, setMarking] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const applyCache = useCallback(
    async (): Promise<boolean> => {
      const cached = await offlineCacheGet<NotificationsCachePayload>(
        OFFLINE_CACHE.notifications,
      );
      if (!cached?.value || !Array.isArray(cached.value.notifications))
        return false;
      setNotifications(cached.value.notifications);
      setUnreadCount(cached.value.unreadCount ?? 0);
      setFromCache(true);
      return true;
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setFromCache(false);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as {
          notifications?: NotificationRow[];
          unreadCount?: number;
        };
        const list = data.notifications ?? [];
        const unread = data.unreadCount ?? 0;
        setNotifications(list);
        setUnreadCount(unread);
        await offlineCachePut(OFFLINE_CACHE.notifications, {
          notifications: list,
          unreadCount: unread,
        });
        return;
      }
      const restored = await applyCache();
      if (!restored) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      const restored = await applyCache();
      if (!restored) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [applyCache]);

  useEffect(() => {
    void load();
  }, [load]);

  useOfflineSyncEffect(() => {
    void load();
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const el = panelRef.current;
      if (!el) return;
      const target = e.target as Node;
      if (!el.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function markAllRead() {
    setMarking(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "markAllRead" }),
      });
      if (res.ok) {
        setNotifications((prev) => {
          const next = prev.map((n) => ({ ...n, read: true }));
          void offlineCachePut(OFFLINE_CACHE.notifications, {
            notifications: next,
            unreadCount: 0,
          });
          return next;
        });
        setUnreadCount(0);
        setFromCache(false);
      }
    } finally {
      setMarking(false);
    }
  }

  const recent = notifications.slice(0, 5);
  const badge =
    unreadCount > 0 ? (unreadCount > 99 ? "99+" : String(unreadCount)) : null;

  return (
    <div className="relative" ref={panelRef}>
      <Button
        type="button"
        variant="ghost"
        className="relative h-9 w-9 shrink-0 p-0 text-foreground"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        {badge != null && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
            {badge}
          </span>
        )}
      </Button>

      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] max-w-[360px]",
            "rounded-xl border border-border bg-card text-card-foreground shadow-lg",
          )}
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {fromCache ? (
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200/90">
                {tOff("cached_hint")}
              </p>
            ) : null}
          </div>

          <div className="max-h-[min(420px,70vh)] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : recent.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <div className="flex gap-3">
                      <div className="mt-1.5 flex w-2 shrink-0 justify-center">
                        {!n.read && (
                          <span
                            className="h-2 w-2 rounded-full bg-blue-500"
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {n.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {truncateMessage(n.message)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatTimeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border p-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={marking || unreadCount === 0}
              onClick={() => void markAllRead()}
            >
              {t("mark_all_read")}
            </Button>
            <Link
              href="/dashboard/notifications"
              className="text-center text-sm font-medium text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              {t("view_all")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
