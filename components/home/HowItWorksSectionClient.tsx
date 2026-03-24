"use client";

import { Upload, Bot, Map, Link2, FileCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { landing } from "@/lib/landing-theme";
import { useLandingLightChrome } from "@/hooks/use-landing-light-chrome";
import { cn } from "@/lib/utils";

const STEP_ICONS = [Upload, Bot, Map, Link2, FileCheck] as const;

type Step = { num: number; title: string; desc: string };

type Props = {
  sectionTitle: string;
  sectionSubtitle: string;
  signupCta: string;
  steps: Step[];
};

export function HowItWorksSectionClient({
  sectionTitle,
  sectionSubtitle,
  signupCta,
  steps,
}: Props) {
  const isLight = useLandingLightChrome();

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
      <div className={`${landing.container} max-w-4xl`}>
        <h2
          className={cn(
            "text-center text-3xl font-bold tracking-tight lg:text-4xl",
            isLight ? "text-zinc-900 dark:text-zinc-900" : landing.h2,
          )}
        >
          {sectionTitle}
        </h2>
        <p
          className={cn(
            landing.lead,
            isLight && "text-zinc-600 dark:text-zinc-600",
          )}
        >
          {sectionSubtitle}
        </p>

        <div className="mt-12 space-y-6 lg:mt-16 lg:space-y-8">
          {steps.map((step, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <div
                key={step.num}
                className={cn(
                  landing.card,
                  "flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8",
                  isLight &&
                    "border-zinc-200 bg-white shadow-md shadow-zinc-200/40 dark:border-zinc-200 dark:bg-white",
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-500 text-sm font-bold",
                    isLight
                      ? "bg-blue-50 text-blue-600"
                      : "bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-400",
                  )}
                >
                  {step.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
                        isLight
                          ? "bg-zinc-100 text-zinc-600"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3
                      className={cn(
                        "text-lg font-semibold",
                        isLight
                          ? "text-zinc-900 dark:text-zinc-900"
                          : "text-zinc-900 dark:text-zinc-50",
                      )}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p
                    className={cn(
                      "mt-3 text-pretty text-base leading-relaxed lg:text-lg",
                      isLight
                        ? "text-zinc-600 dark:text-zinc-600"
                        : "text-zinc-600 dark:text-zinc-400",
                    )}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex justify-center">
          <Link href="/sign-up" className={landing.btnPrimaryMuted}>
            {signupCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
