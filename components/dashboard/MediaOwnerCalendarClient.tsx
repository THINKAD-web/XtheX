"use client";

import * as React from "react";
import { MediaCalendarEventKind } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type MediaOpt = { id: string; mediaName: string };

type CalKind = "BLOCKED" | "HOLD" | "BOOKED";

export function MediaOwnerCalendarClient({
  medias,
  labels,
}: {
  medias: MediaOpt[];
  labels: {
    title: string;
    media: string;
    from: string;
    to: string;
    kind: string;
    note: string;
    add: string;
    load: string;
    delete: string;
    empty: string;
  };
}) {
  const [from, setFrom] = React.useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = React.useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [events, setEvents] = React.useState<
    {
      id: string;
      startAt: string;
      endAt: string;
      kind: CalKind;
      note: string | null;
      media: { mediaName: string };
    }[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [mediaId, setMediaId] = React.useState(medias[0]?.id ?? "");
  const [startAt, setStartAt] = React.useState("");
  const [endAt, setEndAt] = React.useState("");
  const [kind, setKind] = React.useState<CalKind>("BLOCKED");
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    try {
      const p = new URLSearchParams({
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
      });
      const res = await fetch(`/api/dashboard/media-owner/calendar?${p}`);
      const data = (await res.json()) as { ok?: boolean; events?: typeof events };
      if (!res.ok || !data.ok || !data.events) {
        setEvents([]);
        return;
      }
      setEvents(data.events);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaId || !startAt || !endAt || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/media-owner/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          kind,
          note: note.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Failed");
        return;
      }
      toast.success("Saved");
      setNote("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/dashboard/media-owner/calendar/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-zinc-500">{labels.from}</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-zinc-500">{labels.to}</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
          {labels.load}
        </Button>
      </div>

      <form onSubmit={addEvent} className="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">{labels.title}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-zinc-500">{labels.media}</label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={mediaId}
              onChange={(e) => setMediaId(e.target.value)}
            >
              {medias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.mediaName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">{labels.kind}</label>
            <select
              className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={kind}
              onChange={(e) => setKind(e.target.value as CalKind)}
            >
              <option value="BLOCKED">BLOCKED</option>
              <option value="HOLD">HOLD</option>
              <option value="BOOKED">BOOKED</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500">Start</label>
            <Input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">End</label>
            <Input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-500">{labels.note}</label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button type="submit" size="sm" disabled={saving || !medias.length}>
          {labels.add}
        </Button>
      </form>

      <div className="space-y-2">
        {events.length === 0 && !loading ? (
          <p className="text-sm text-zinc-500">{labels.empty}</p>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
              >
                <div>
                  <span className="font-medium">{ev.media.mediaName}</span> · {ev.kind}
                  <div className="text-xs text-zinc-500">
                    {new Date(ev.startAt).toLocaleString()} – {new Date(ev.endAt).toLocaleString()}
                  </div>
                  {ev.note ? <div className="text-xs">{ev.note}</div> : null}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => void remove(ev.id)}>
                  {labels.delete}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
