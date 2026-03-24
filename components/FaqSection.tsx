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
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const t = useTranslations("home.faq");
  const isLight = useLandingLightChrome();
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
    <section
      className={cn(
        landing.section,
        "relative border-t py-20 lg:py-28",
        isLight
          ? "border-zinc-200 bg-white"
          : "border-zinc-800/50 bg-white dark:bg-zinc-950",
      )}
    >
      <div className={`${landing.container} max-w-3xl`}>
        <h2
          className={cn(
            "text-center text-3xl font-bold tracking-tight lg:text-4xl",
            isLight ? "text-zinc-900 dark:text-zinc-900" : landing.h2,
          )}
        >
          {t("section_title")}
        </h2>
        <p
          className={cn(
            landing.lead,
            isLight && "text-zinc-600 dark:text-zinc-600",
          )}
        >
          {t("section_subtitle")}
        </p>

        <div
          className={cn(
            `${landing.surface} mt-12 overflow-hidden hover:scale-100 lg:mt-16`,
            isLight &&
              "border-zinc-200 bg-white shadow-lg shadow-zinc-200/40 dark:border-zinc-200 dark:bg-white",
          )}
        >
          <Accordion type="single" collapsible className="px-1 sm:px-2">
            {faqItems.map(({ q, a }, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className={cn(
                  "border-zinc-200 px-3 sm:px-4",
                  !isLight && "dark:border-zinc-700/80",
                )}
              >
                <AccordionTrigger
                  className={cn(
                    "rounded-lg py-5 text-left text-base font-semibold text-foreground no-underline hover:no-underline",
                    "hover:bg-accent/80 data-[state=open]:bg-accent/60",
                    "[&[data-state=open]>svg]:text-blue-600 dark:[&[data-state=open]>svg]:text-blue-400",
                  )}
                >
                  <span className="pr-4 text-pretty">{t(q)}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-0 pr-2 text-pretty text-muted-foreground leading-relaxed sm:pr-4">
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
