"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Headphones,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "xthex-chat-history";
const STORAGE_HUMAN_KEY = "xthex-chat-human-requested";

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 animate-[chatBounce_1.2s_ease-in-out_infinite] rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

export function ChatWidget() {
  const pathname = usePathname();
  const t = useTranslations("liveChat");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [humanRequested, setHumanRequested] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fullyVisible = open && !minimized;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
      const h = localStorage.getItem(STORAGE_HUMAN_KEY);
      if (h === "1") setHumanRequested(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  useEffect(() => {
    if (humanRequested) {
      try {
        localStorage.setItem(STORAGE_HUMAN_KEY, "1");
      } catch {
        // ignore
      }
    }
  }, [humanRequested]);

  useEffect(() => {
    if (fullyVisible) setReadCount(messages.length);
  }, [fullyVisible, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, minimized, expanded]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: t("greeting") }]);
    }
  }, [open, messages.length, t]);

  const unread = Math.max(0, messages.length - readCount);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, locale }),
        });
        const data = (await res.json()) as { reply?: string; error?: string };
        const reply = data.reply ?? t("error_generic");
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: t("error_generic") }]);
      } finally {
        setLoading(false);
      }
    },
    [loading, locale, t],
  );

  const requestHuman = useCallback(() => {
    if (humanRequested) return;
    setHumanRequested(true);
    setMessages((prev) => [...prev, { role: "assistant", content: t("human_ack") }]);
  }, [humanRequested, t]);

  const quickReplies = [t("quick_reply_1"), t("quick_reply_2"), t("quick_reply_3")];
  const quickActions = [t("quick_action_1"), t("quick_action_2"), t("quick_action_3")];

  if (pathname?.includes("/admin")) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setMinimized(false);
        }}
        className={cn(
          "fixed bottom-36 right-4 z-[86] flex h-14 w-14 items-center justify-center rounded-full",
          "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30",
          "transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
          "md:right-6",
        )}
        aria-label={t("launcher_aria")}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {unread > 0 ? (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md"
                aria-label={t("badge_unread")}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "fixed z-[86] flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
            "right-4 w-[calc(100vw-2rem)] md:right-6",
            expanded ? "max-w-md" : "max-w-sm",
            "bottom-[13.5rem] max-h-[min(78vh,640px)] md:bottom-[14rem]",
          )}
        >
          <div
            className="flex cursor-pointer items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2.5 md:px-4"
            onClick={() => setMinimized((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setMinimized((v) => !v);
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={!minimized}
          >
            <Bot className="h-5 w-5 shrink-0 text-white" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{t("title")}</p>
              <p className="truncate text-[10px] text-blue-100">{t("subtitle")}</p>
            </div>
            {minimized && unread > 0 ? (
              <span className="mr-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="shrink-0 rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label={expanded ? t("restore_aria") : t("maximize_aria")}
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMinimized((v) => !v);
              }}
              className="shrink-0 rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label={t("minimize_aria")}
            >
              {minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="shrink-0 rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label={t("close_aria")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!minimized && (
            <>
              <div
                className={cn(
                  "flex flex-col gap-2 overflow-y-auto p-3",
                  expanded ? "min-h-[min(52vh,420px)] max-h-[min(52vh,420px)]" : "h-56 max-h-56",
                )}
              >
                {messages.map((m, i) => (
                  <div
                    key={`${i}-${m.content.slice(0, 12)}`}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        m.role === "user"
                          ? "rounded-br-sm bg-blue-600 text-white"
                          : "rounded-bl-sm bg-muted text-foreground",
                      )}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {messages.length <= 1 && (
                <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
                  {quickReplies.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void send(q)}
                      className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-3 py-1.5">
                {quickActions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    className="rounded-full bg-gradient-to-r from-blue-600/10 to-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 transition-colors hover:from-blue-600/20 hover:to-cyan-500/20 dark:text-blue-400"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {!humanRequested ? (
                <div className="border-t border-border bg-muted/30 px-3 py-2">
                  <button
                    type="button"
                    onClick={requestHuman}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-600/10 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-600/15 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:text-emerald-100 dark:hover:bg-emerald-900/40"
                  >
                    <Headphones className="h-4 w-4 shrink-0" />
                    {t("connect_human")}
                  </button>
                </div>
              ) : (
                <div className="border-t border-border bg-muted/20 px-3 py-2 text-center">
                  <Link
                    href="/contact"
                    className="text-xs font-semibold text-blue-600 underline-offset-2 hover:underline dark:text-blue-300"
                  >
                    {t("contact_link")}
                  </Link>
                </div>
              )}

              <div className="flex items-center gap-2 border-t border-border px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void send(input)}
                  placeholder={t("placeholder")}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => void send(input)}
                  disabled={!input.trim() || loading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
                  aria-label={t("send_aria")}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
