"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Mail, FileText } from "lucide-react";

export function EmailSubscriptionPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const triggered = useRef(false);

  const trigger = useCallback(() => {
    if (triggered.current) return;
    const seen = localStorage.getItem("xthex_email_sub_dismissed");
    if (seen) return;
    triggered.current = true;
    setShow(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("xthex_email_sub_dismissed")) return;

    const timer = setTimeout(trigger, 30_000);

    const handleScroll = () => {
      const scrollPercent =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent >= 0.5) trigger();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [trigger]);

  const close = () => {
    setShow(false);
    localStorage.setItem("xthex_email_sub_dismissed", "1");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    localStorage.setItem("xthex_email_sub_dismissed", "1");
    setTimeout(() => setShow(false), 2500);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 mb-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 rounded-3xl bg-white p-8 shadow-2xl sm:mb-0 dark:bg-zinc-900">
        <button
          onClick={close}
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20">
              <Mail className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Thank you!
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              OOH 트렌드 리포트를 이메일로 보내드리겠습니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20">
              <FileText className="h-7 w-7 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              OOH 트렌드 리포트 무료 제공
            </h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              이메일을 구독하시면 최신 옥외광고 트렌드 리포트를
              <br />
              무료로 받아보실 수 있습니다.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 flex w-full gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="submit"
                className="flex-shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500"
              >
                Subscribe
              </button>
            </form>
            <p className="mt-3 text-[11px] text-zinc-400">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
