"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_REPLIES: Record<string, string[]> = {
  ko: ["도쿄 광고 알아보고 싶어요", "서울 매체 추천해주세요", "예산은 얼마나 필요한가요?"],
  en: ["Tell me about Tokyo OOH ads", "Recommend Seoul media", "What budget do I need?"],
  ja: ["東京の広告について知りたい", "ソウルの媒体を教えて", "予算はどのくらい必要？"],
  zh: ["想了解东京户外广告", "推荐首尔媒体", "需要多少预算？"],
};

const GREETINGS: Record<string, string> = {
  ko: "안녕하세요! XtheX AI 어시스턴트입니다 😊\n전 세계 옥외광고에 대해 무엇이든 물어보세요.",
  en: "Hello! I'm the XtheX AI assistant 😊\nAsk me anything about global OOH advertising.",
  ja: "こんにちは！XtheX AIアシスタントです 😊\n世界中の屋外広告について何でもお聞きください。",
  zh: "您好！这是XtheX AI助手 😊\n关于全球户外广告，请随时提问。",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const quickReplies = QUICK_REPLIES[locale] ?? QUICK_REPLIES.en;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: GREETINGS[locale] ?? GREETINGS.en }]);
    }
  }, [open, locale, messages.length]);

  const send = async (text: string) => {
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
      const data = await res.json() as { reply?: string };
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "오류가 발생했습니다." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "오류가 발생했습니다. 다시 시도해주세요." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 left-4 z-[88] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-110 md:bottom-10 md:left-6"
        aria-label="AI 채팅"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* 채팅 패널 */}
      {open && (
        <div className="fixed bottom-40 left-4 z-[88] flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl md:bottom-28 md:left-6">
          {/* 헤더 */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3">
            <Bot className="h-5 w-5 text-white" />
            <div>
              <p className="text-sm font-semibold text-white">XtheX AI</p>
              <p className="text-[10px] text-blue-100">Global OOH Assistant · 24/7</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 메시지 */}
          <div className="flex h-64 flex-col gap-2 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
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
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 빠른 질문 */}
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

          {/* 입력창 */}
          <div className="flex items-center gap-2 border-t border-border px-3 py-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder={locale === "ko" ? "메시지 입력..." : locale === "ja" ? "メッセージを入力..." : locale === "zh" ? "输入消息..." : "Type a message..."}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-500 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
