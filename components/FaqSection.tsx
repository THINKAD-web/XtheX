"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
  const t = useTranslations("home.faq");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const faqItems = [
    { q: "q1", a: "a1" },
    { q: "q2", a: "a2" },
    { q: "q3", a: "a3" },
    { q: "q4", a: "a4" },
    { q: "q5", a: "a5" },
  ];

  return (
    <section className="relative border-t border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {t("section_title")}
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          {t("section_subtitle")}
        </p>
        <Accordion type="single" collapsible className="mt-10">
          {faqItems.map(({ q, a }, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{t(q)}</AccordionTrigger>
              <AccordionContent>{t(a)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

