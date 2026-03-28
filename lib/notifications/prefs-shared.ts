import type { NotificationType } from "@prisma/client";

export const NOTIFICATION_CATEGORIES: NotificationType[] = [
  "INQUIRY_RECEIVED",
  "MEDIA_APPROVED",
  "MEDIA_REJECTED",
  "CAMPAIGN_UPDATE",
  "SYSTEM",
];

export type NotificationChannels = {
  push: boolean;
  email: boolean;
  sms: boolean;
};

export type QuietHoursConfig = {
  enabled: boolean;
  /** IANA timezone, e.g. Asia/Seoul */
  timezone: string;
  /** HH:mm 24h in that timezone */
  start: string;
  end: string;
};

export type NotificationPrefsV2 = {
  categories: Record<NotificationType, boolean>;
  channels: NotificationChannels;
  quietHours: QuietHoursConfig;
};

const DEFAULT_CHANNELS: NotificationChannels = {
  push: true,
  email: true,
  sms: true,
};

const DEFAULT_QUIET: QuietHoursConfig = {
  enabled: false,
  timezone: "Asia/Seoul",
  start: "22:00",
  end: "07:00",
};

function mergeCategoriesOnly(stored: unknown): Record<NotificationType, boolean> {
  const out = {} as Record<NotificationType, boolean>;
  for (const t of NOTIFICATION_CATEGORIES) {
    let v: boolean | undefined;
    if (stored && typeof stored === "object") {
      v = (stored as Record<string, boolean | undefined>)[t];
    }
    out[t] = v === false ? false : true;
  }
  return out;
}

/** Detect v1 (flat category booleans) vs v2 `{ categories, channels, quietHours }`. */
export function normalizeNotificationPrefs(raw: unknown): NotificationPrefsV2 {
  const base: NotificationPrefsV2 = {
    categories: mergeCategoriesOnly(null),
    channels: { ...DEFAULT_CHANNELS },
    quietHours: { ...DEFAULT_QUIET },
  };
  if (!raw || typeof raw !== "object") return base;

  const o = raw as Record<string, unknown>;

  if ("categories" in o && o.categories && typeof o.categories === "object") {
    base.categories = mergeCategoriesOnly(o.categories);
    if (o.channels && typeof o.channels === "object") {
      const c = o.channels as Record<string, boolean>;
      base.channels = {
        push: c.push === false ? false : true,
        email: c.email === false ? false : true,
        sms: c.sms === false ? false : true,
      };
    }
    if (o.quietHours && typeof o.quietHours === "object") {
      const q = o.quietHours as Record<string, unknown>;
      base.quietHours = {
        enabled: q.enabled === true,
        timezone:
          typeof q.timezone === "string" && q.timezone.trim()
            ? q.timezone.trim().slice(0, 80)
            : DEFAULT_QUIET.timezone,
        start:
          typeof q.start === "string" && q.start.trim().length >= 4
            ? padTime(q.start.trim().slice(0, 5))
            : DEFAULT_QUIET.start,
        end:
          typeof q.end === "string" && q.end.trim().length >= 4
            ? padTime(q.end.trim().slice(0, 5))
            : DEFAULT_QUIET.end,
      };
    }
    return base;
  }

  base.categories = mergeCategoriesOnly(raw);
  return base;
}

function padTime(t: string): string {
  const [h, m] = t.split(":");
  const hh = (h ?? "0").length === 1 ? `0${h}` : (h ?? "00").padStart(2, "0").slice(-2);
  const mm = (m ?? "00").padStart(2, "0").slice(0, 2);
  return `${hh}:${mm}`;
}

/** @deprecated use normalizeNotificationPrefs().categories */
export function mergeNotificationPrefs(stored: unknown): Record<NotificationType, boolean> {
  return normalizeNotificationPrefs(stored).categories;
}

export function isNotificationTypeEnabled(
  prefs: unknown,
  type: NotificationType,
): boolean {
  return normalizeNotificationPrefs(prefs).categories[type] !== false;
}

export function getDisabledNotificationTypes(prefs: unknown): NotificationType[] {
  const c = normalizeNotificationPrefs(prefs).categories;
  return NOTIFICATION_CATEGORIES.filter((t) => c[t] === false);
}

/**
 * Current local time in `timezone` as minutes from midnight [0, 1440).
 */
export function localMinutesFromMidnight(date: Date, timezone: string): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(date);
    const hh = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const mm = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    return hh * 60 + mm;
  } catch {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }
}

function parseHm(s: string): number {
  const [h, m] = s.split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/** When quiet hours wrap past midnight, end is exclusive. */
export function isWithinQuietHours(
  quiet: QuietHoursConfig,
  now: Date = new Date(),
): boolean {
  if (!quiet.enabled) return false;
  const cur = localMinutesFromMidnight(now, quiet.timezone);
  const start = parseHm(quiet.start);
  const end = parseHm(quiet.end);
  if (start === end) return false;
  if (start < end) {
    return cur >= start && cur < end;
  }
  return cur >= start || cur < end;
}

export function channelDeliveryAllowed(
  prefs: unknown,
  channel: keyof NotificationChannels,
  now: Date = new Date(),
): boolean {
  const n = normalizeNotificationPrefs(prefs);
  if (!n.channels[channel]) return false;
  if (isWithinQuietHours(n.quietHours, now)) return false;
  return true;
}
