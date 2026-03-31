"use client";

import * as React from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Msg = {
  id: string;
  body: string;
  attachmentUrl: string | null;
  createdAt: string;
  authorId: string;
};

export function InquiryThreadPanel({
  inquiryId,
  currentUserId,
  labels,
}: {
  inquiryId: string;
  currentUserId: string;
  labels: {
    title: string;
    placeholder: string;
    send: string;
    attachmentHint: string;
    empty: string;
  };
}) {
  const [items, setItems] = React.useState<Msg[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [body, setBody] = React.useState("");
  const [attachmentUrl, setAttachmentUrl] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/inquiries/${inquiryId}/messages`);
      const data = (await res.json()) as { ok?: boolean; messages?: Msg[] };
      if (!res.ok || !data.ok || !data.messages) {
        setItems([]);
        return;
      }
      setItems(data.messages);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const t = body.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/dashboard/inquiries/${inquiryId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: t,
          ...(attachmentUrl.trim() ? { attachmentUrl: attachmentUrl.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: Msg };
      if (!res.ok || !data.message) {
        toast.error(data.error ?? "Failed to send");
        return;
      }
      setItems((prev) => [...prev, data.message!]);
      setBody("");
      setAttachmentUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{labels.title}</h2>
      <div className="mt-3 max-h-80 space-y-3 overflow-y-auto rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
        {loading ? (
          <p className="text-sm text-zinc-500">…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">{labels.empty}</p>
        ) : (
          items.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.authorId === currentUserId
                  ? "ml-6 bg-blue-600 text-white"
                  : "mr-6 bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              {m.attachmentUrl ? (
                <a
                  href={m.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-1 inline-block text-xs underline ${
                    m.authorId === currentUserId ? "text-blue-100" : "text-blue-600"
                  }`}
                >
                  {m.attachmentUrl}
                </a>
              ) : null}
              <p
                className={`mt-1 text-[10px] opacity-70 ${
                  m.authorId === currentUserId ? "text-blue-100" : "text-zinc-500"
                }`}
              >
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
      <form onSubmit={onSend} className="mt-3 space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={labels.placeholder}
          rows={3}
          className="resize-none"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <Paperclip className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            <input
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder={labels.attachmentHint}
              className="h-9 w-full rounded-md border border-zinc-300 bg-transparent px-2 text-sm dark:border-zinc-700"
            />
          </div>
          <Button type="submit" size="sm" disabled={sending || !body.trim()} className="gap-1">
            <Send className="h-3.5 w-3.5" />
            {labels.send}
          </Button>
        </div>
      </form>
    </section>
  );
}
