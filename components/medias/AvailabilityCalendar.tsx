"use client";

import { useMemo } from "react";

type AvailabilityStatus = "available" | "booked" | "inquiry";

interface DayEntry {
  date: string; // YYYY-MM-DD
  status: AvailabilityStatus;
}

interface AvailabilityCalendarProps {
  mediaId: string;
  availabilityData?: DayEntry[];
  labels: {
    title: string;
    available: string;
    booked: string;
    inquiry: string;
    days: string[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  };
}

function seedRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = (h ^ (h >>> 16)) * 0x45d9f3b;
    h = h ^ (h >>> 16);
    return ((h >>> 0) / 4294967296);
  };
}

function generateMockAvailability(mediaId: string, days: number): DayEntry[] {
  const rand = seedRandom(mediaId);
  const entries: DayEntry[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const r = rand();
    const status: AvailabilityStatus =
      r < 0.55 ? "available" : r < 0.8 ? "booked" : "inquiry";
    entries.push({ date: dateStr, status });
  }
  return entries;
}

const statusStyles: Record<AvailabilityStatus, string> = {
  available:
    "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40",
  booked:
    "bg-red-500/20 text-red-300 ring-1 ring-red-500/40",
  inquiry:
    "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40",
};

export function AvailabilityCalendar({
  mediaId,
  availabilityData,
  labels,
}: AvailabilityCalendarProps) {
  const entries = useMemo(
    () => availabilityData ?? generateMockAvailability(mediaId, 30),
    [mediaId, availabilityData],
  );

  const statusMap = useMemo(() => {
    const m = new Map<string, AvailabilityStatus>();
    entries.forEach((e) => m.set(e.date, e.status));
    return m;
  }, [entries]);

  const { weeks, monthLabel } = useMemo(() => {
    if (entries.length === 0) return { weeks: [], monthLabel: "" };
    const first = new Date(entries[0].date + "T00:00:00");
    const last = new Date(entries[entries.length - 1].date + "T00:00:00");

    const fmtMonth = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const label =
      first.getMonth() === last.getMonth()
        ? fmtMonth(first)
        : `${fmtMonth(first)} – ${fmtMonth(last)}`;

    const rows: (Date | null)[][] = [];
    const startDow = first.getDay();
    let currentWeek: (Date | null)[] = Array(startDow).fill(null);

    for (let i = 0; i < entries.length; i++) {
      const d = new Date(entries[i].date + "T00:00:00");
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        rows.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      rows.push(currentWeek);
    }

    return { weeks: rows, monthLabel: label };
  }, [entries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {labels.title}
        </h2>
        <span className="text-xs text-zinc-500">{monthLabel}</span>
      </div>

      <div className="rounded-2xl bg-zinc-900/80 p-4 ring-1 ring-zinc-800">
        {/* Day-of-week header */}
        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
          {labels.days.map((d) => (
            <span key={d} className="text-[10px] font-medium text-zinc-500">
              {d}
            </span>
          ))}
        </div>

        {/* Weeks */}
        <div className="grid gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (!day) {
                  return <div key={di} className="aspect-square" />;
                }
                const dateStr = day.toISOString().slice(0, 10);
                const status = statusMap.get(dateStr) ?? "inquiry";
                const dayNum = day.getDate();
                return (
                  <div
                    key={dateStr}
                    className={`flex aspect-square items-center justify-center rounded-lg text-[11px] font-medium transition-colors ${statusStyles[status]}`}
                    title={`${dateStr}: ${status}`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-3">
          {(
            [
              ["available", labels.available],
              ["booked", labels.booked],
              ["inquiry", labels.inquiry],
            ] as const
          ).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-sm ${statusStyles[status]}`}
              />
              <span className="text-[10px] text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
