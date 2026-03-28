"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { NotificationType } from "@prisma/client";
import { toast } from "sonner";
import {
  NOTIFICATION_CATEGORIES,
  normalizeNotificationPrefs,
  type NotificationPrefsV2,
} from "@/lib/notifications/prefs-shared";
import { NOTIFICATION_TIMEZONE_OPTIONS } from "@/lib/notifications/timezones";
import { cn } from "@/lib/utils";

type PrefsMap = Record<NotificationType, boolean>;

const META: { key: NotificationType; label: string; desc: string }[] = [
  { key: "INQUIRY_RECEIVED", label: "cat_inquiry", desc: "cat_inquiry_desc" },
  { key: "MEDIA_APPROVED", label: "cat_media_approved", desc: "cat_media_approved_desc" },
  { key: "MEDIA_REJECTED", label: "cat_media_rejected", desc: "cat_media_rejected_desc" },
  { key: "CAMPAIGN_UPDATE", label: "cat_campaign", desc: "cat_campaign_desc" },
  { key: "SYSTEM", label: "cat_system", desc: "cat_system_desc" },
];

function defaultCategories(): PrefsMap {
  const o = {} as PrefsMap;
  for (const k of NOTIFICATION_CATEGORIES) o[k] = true;
  return o;
}

function defaultFull(): NotificationPrefsV2 {
  return normalizeNotificationPrefs(null);
}

export function NotificationCategoryPrefs() {
  const t = useTranslations("notificationsPrefs");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [demo, setDemo] = React.useState(false);
  const [full, setFull] = React.useState<NotificationPrefsV2>(defaultFull);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/preferences", { credentials: "include" });
      const data = (await res.json()) as {
        prefs?: NotificationPrefsV2;
        demo?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error);
      if (data.prefs) setFull(normalizeNotificationPrefs(data.prefs));
      setDemo(Boolean(data.demo));
    } catch {
      toast.error(t("load_failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function persist(next: NotificationPrefsV2) {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prefs: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        prefs?: NotificationPrefsV2;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error);
      if (data.prefs) setFull(normalizeNotificationPrefs(data.prefs));
      toast.success(t("saved"));
    } catch {
      toast.error(t("save_failed"));
      void load();
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(key: NotificationType) {
    if (demo || loading) return;
    const next: NotificationPrefsV2 = {
      ...full,
      categories: { ...full.categories, [key]: !full.categories[key] },
    };
    setFull(next);
    void persist(next);
  }

  function setChannel(ch: keyof NotificationPrefsV2["channels"], on: boolean) {
    if (demo || loading) return;
    const next: NotificationPrefsV2 = {
      ...full,
      channels: { ...full.channels, [ch]: on },
    };
    setFull(next);
    void persist(next);
  }

  function patchQuiet(patch: Partial<NotificationPrefsV2["quietHours"]>) {
    if (demo || loading) return;
    const next: NotificationPrefsV2 = {
      ...full,
      quietHours: { ...full.quietHours, ...patch },
    };
    setFull(next);
    void persist(next);
  }

  const categories = full.categories;

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        {demo ? (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
            {t("demo")}
          </p>
        ) : null}
        {loading ? (
          <p className="text-xs text-muted-foreground">{t("loading")}</p>
        ) : (
          <ul className="space-y-2">
            {META.map((row) => (
              <li
                key={row.key}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{t(row.label)}</p>
                  <p className="text-xs text-muted-foreground">{t(row.desc)}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={categories[row.key]}
                  disabled={saving || demo}
                  onClick={() => toggleCategory(row.key)}
                  className={cn(
                    "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    categories[row.key] ? "bg-primary" : "bg-muted",
                    (saving || demo) && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform",
                      categories[row.key] ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                  <span className="sr-only">
                    {categories[row.key] ? t("switch_on") : t("switch_off")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("channels_title")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("channels_subtitle")}</p>
        </div>
        {!loading ? (
          <ul className="space-y-2">
            {(
              [
                ["push", "ch_push", "ch_push_desc"],
                ["email", "ch_email", "ch_email_desc"],
                ["sms", "ch_sms", "ch_sms_desc"],
              ] as const
            ).map(([key, labelKey, descKey]) => (
              <li
                key={key}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{t(labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(descKey)}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={full.channels[key]}
                  disabled={saving || demo}
                  onClick={() => setChannel(key, !full.channels[key])}
                  className={cn(
                    "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    full.channels[key] ? "bg-primary" : "bg-muted",
                    (saving || demo) && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform",
                      full.channels[key] ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("quiet_title")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("quiet_subtitle")}</p>
        </div>
        {!loading ? (
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={full.quietHours.enabled}
                disabled={saving || demo}
                onChange={(e) => patchQuiet({ enabled: e.target.checked })}
              />
              {t("quiet_enabled")}
            </label>
            <p className="text-xs text-muted-foreground">{t("quiet_hint_channels")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">{t("tz_label")}</label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={full.quietHours.timezone}
                  disabled={saving || demo || !full.quietHours.enabled}
                  onChange={(e) => patchQuiet({ timezone: e.target.value })}
                >
                  {!NOTIFICATION_TIMEZONE_OPTIONS.some((z) => z.value === full.quietHours.timezone) ? (
                    <option value={full.quietHours.timezone}>{full.quietHours.timezone}</option>
                  ) : null}
                  {NOTIFICATION_TIMEZONE_OPTIONS.map((z) => (
                    <option key={z.value} value={z.value}>
                      {z.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">{t("quiet_window")}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={full.quietHours.start}
                    disabled={saving || demo || !full.quietHours.enabled}
                    onChange={(e) => patchQuiet({ start: e.target.value })}
                  />
                  <span className="text-muted-foreground">–</span>
                  <input
                    type="time"
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={full.quietHours.end}
                    disabled={saving || demo || !full.quietHours.enabled}
                    onChange={(e) => patchQuiet({ end: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("quiet_hint_overnight")}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
