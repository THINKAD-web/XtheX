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
import { landing } from "@/lib/landing-theme";

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
    <section className={`${landing.section} bg-white dark:bg-zinc-950`}>
      <div className={`${landing.container} max-w-3xl`}>
        <h2 className={landing.h2}>{t("section_title")}</h2>
        <p className={landing.lead}>{t("section_subtitle")}</p>

        <div
          className={`${landing.surface} mt-12 overflow-hidden hover:scale-100 lg:mt-16`}
        >
          <Accordion type="single" collapsible className="px-1 sm:px-2">
            {faqItems.map(({ q, a }, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-zinc-200 px-3 dark:border-zinc-700/80 sm:px-4"
              >
                <AccordionTrigger className="rounded-lg py-5 text-left text-base font-semibold text-zinc-900 no-underline hover:no-underline hover:bg-zinc-100/80 data-[state=open]:bg-zinc-100/60 dark:text-zinc-100 dark:hover:bg-zinc-800/60 dark:data-[state=open]:bg-zinc-800/40 [&[data-state=open]>svg]:text-blue-400">
                  <span className="pr-4 text-pretty">{t(q)}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-0 pr-2 text-pretty leading-relaxed text-zinc-600 dark:text-zinc-400 sm:pr-4">
                  {t(a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
