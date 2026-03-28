"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { landing } from "@/lib/landing-theme";
import { toast } from "sonner";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Mail,
  Send,
  Loader2,
} from "lucide-react";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-700/60">
      <button
        type="button"
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="pr-4 text-base font-medium text-zinc-900 dark:text-zinc-100">
          {q}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[500px] pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{a}</p>
      </div>
    </div>
  );
}

export function HelpPageClient() {
  const t = useTranslations("help");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const faqKeys = Array.from({ length: 12 }, (_, i) => i + 1);

  const filteredFaqs = faqKeys.filter((i) => {
    if (!search.trim()) return true;
    const q = t(`faq_q${i}`).toLowerCase();
    const a = t(`faq_a${i}`).toLowerCase();
    return q.includes(search.toLowerCase()) || a.includes(search.toLowerCase());
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(t("form_required"));
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: 5, message: `[Help Contact] ${name} <${email}>\n${message}` }),
      });
      if (res.ok) {
        toast.success(t("form_success"));
        setName("");
        setEmail("");
        setMessage("");
      } else {
        toast.error(t("form_error"));
      }
    } catch {
      toast.error(t("form_error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`${landing.container} py-16 lg:py-24`}>
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40">
          <HelpCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className={landing.h1}>{t("title")}</h1>
        <p className={landing.lead}>{t("subtitle")}</p>
      </div>

      {/* Search */}
      <div className="mx-auto mt-10 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_placeholder")}
            className={`${landing.input} pl-10`}
          />
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-12 max-w-3xl">
        <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {t("faq_title")}
        </h2>
        <div>
          {filteredFaqs.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">{t("no_results")}</p>
          ) : (
            filteredFaqs.map((i) => (
              <FaqItem key={i} q={t(`faq_q${i}`)} a={t(`faq_a${i}`)} />
            ))
          )}
        </div>
      </div>

      {/* Contact form */}
      <div className="mx-auto mt-20 max-w-2xl">
        <div className={`${landing.card} p-8`}>
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {t("contact_title")}
            </h2>
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("contact_subtitle")}
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("form_name")}
              </label>
              <input
                className={landing.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("form_name_ph")}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("form_email")}
              </label>
              <input
                type="email"
                className={landing.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("form_email_ph")}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("form_message")}
              </label>
              <textarea
                className={`${landing.input} h-32 resize-none py-3`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("form_message_ph")}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className={`${landing.btnPrimary} w-full`}
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {sending ? t("form_sending") : t("form_submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
