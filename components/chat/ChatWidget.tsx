"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

type Message = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "xthex-chat-history";

const QUICK_REPLIES: Record<string, string[]> = {
  ko: ["도쿄 광고 알아보고 싶어요", "서울 매체 추천해주세요", "예산은 얼마나 필요한가요?"],
  en: ["Tell me about Tokyo OOH ads", "Recommend Seoul media", "What budget do I need?"],
  ja: ["東京の広告について知りたい", "ソウルの媒体を教えて", "予算はどのくらい必要？"],
  zh: ["想了解东京户外广告", "推荐首尔媒体", "需要多少预算？"],
};

const QUICK_ACTIONS: Record<string, string[]> = {
  ko: ["매체 추천해줘", "가격 알려줘", "문의하기"],
  en: ["Recommend media", "Show pricing", "Contact us"],
  ja: ["媒体おすすめ", "料金を教えて", "お問い合わせ"],
  zh: ["推荐媒体", "查看价格", "联系我们"],
};

const GREETINGS: Record<string, string> = {
  ko: "안녕하세요! XtheX AI 어시스턴트입니다 😊\n전 세계 옥외광고에 대해 무엇이든 물어보세요.",
  en: "Hello! I'm the XtheX AI assistant 😊\nAsk me anything about global OOH advertising.",
  ja: "こんにちは！XtheX AIアシスタントです 😊\n世界中の屋外広告について何でもお聞きください。",
  zh: "您好！这是XtheX AI助手 😊\n关于全球户外广告，请随时提问。",
};

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
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const quickReplies = QUICK_REPLIES[locale] ?? QUICK_REPLIES.en;
  const quickActions = QUICK_ACTIONS[locale] ?? QUICK_ACTIONS.en;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: GREETINGS[locale] ?? GREETINGS.en }]);
    }
  }, [open, locale, messages.length]);

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
        const data = (await res.json()) as { reply?: string };
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply ?? "오류가 발생했습니다." },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, locale],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 left-4 z-[88] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-110 md:bottom-10 md:left-6"
        aria-label="AI 채팅"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-40 left-4 z-[88] flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl md:bottom-28 md:left-6">
          <div
            className="flex cursor-pointer items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3"
            onClick={() => setMinimized((v) => !v)}
          >
            <Bot className="h-5 w-5 text-white" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">XtheX AI</p>
              <p className="text-[10px] text-blue-100">Global OOH Assistant · 24/7</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMinimized((v) => !v);
              }}
              className="text-white/70 hover:text-white"
              aria-label={minimized ? "Expand" : "Minimize"}
            >
              {minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="text-white/70 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!minimized && (
            <>
              <div className="flex h-64 flex-col gap-2 overflow-y-auto p-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed",
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
                      onClick={() => send(q)}
                      className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-900/40"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 border-t border-border px-3 py-1.5">
                {quickActions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full bg-gradient-to-r from-blue-600/10 to-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600 transition-colors hover:from-blue-600/20 hover:to-cyan-500/20 dark:text-blue-400"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-border px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send(input)}
                  placeholder={
                    locale === "ko"
                      ? "메시지 입력..."
                      : locale === "ja"
                        ? "メッセージを入力..."
                        : locale === "zh"
                          ? "输入消息..."
                          : "Type a message..."
                  }
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
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
