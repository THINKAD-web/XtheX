import type { CalendarRegion } from "@/lib/i18n/locale-config";

/**
 * Fixed recurring public holidays (month-day, local civil calendar).
 * Lunar / movable holidays are approximated or omitted — still useful for planning hints.
 */
const MM_DD_BY_REGION: Record<CalendarRegion, string[]> = {
  KR: ["01-01", "03-01", "05-05", "06-06", "08-15", "10-03", "10-09", "12-25"],
  US: ["01-01", "07-04", "11-11", "12-25"],
  JP: ["01-01", "02-11", "02-23", "04-29", "05-03", "05-04", "05-05", "08-11", "11-03", "11-23"],
  CN: ["01-01", "05-01", "10-01", "10-02", "10-03", "10-04", "10-05", "10-06", "10-07"],
  ES: ["01-01", "01-06", "05-01", "08-15", "10-12", "11-01", "12-06", "12-08", "12-25"],
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function monthDayKey(d: Date): string {
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function isRegionalPublicHoliday(region: CalendarRegion, day: Date): boolean {
  const key = monthDayKey(day);
  return MM_DD_BY_REGION[region].includes(key);
}

/** YYYY-MM-DD strings in [start, end] inclusive that fall on a regional holiday */
export function regionalHolidayDatesInRange(
  region: CalendarRegion,
  startYmd: string,
  endYmd: string,
): Set<string> {
  const out = new Set<string>();
  const start = new Date(`${startYmd}T12:00:00`);
  const end = new Date(`${endYmd}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;
  const cur = new Date(start);
  while (cur <= end) {
    if (isRegionalPublicHoliday(region, cur)) {
      const y = cur.getFullYear();
      const m = pad2(cur.getMonth() + 1);
      const d = pad2(cur.getDate());
      out.add(`${y}-${m}-${d}`);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
