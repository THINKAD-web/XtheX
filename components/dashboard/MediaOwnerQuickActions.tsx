"use client";

import * as React from "react";
import { Link } from "@/i18n/navigation";
import { MobileHorizontalSwipe } from "./MobileHorizontalSwipe";

type Props = {
  swipeHint?: string;
  carouselAriaLabel: string;
  cardClass: string;
  registerLabel: string;
  mediasLabel: string;
  inquiriesLabel: string;
};

export function MediaOwnerQuickActions({
  swipeHint,
  carouselAriaLabel,
  cardClass,
  registerLabel,
  mediasLabel,
  inquiriesLabel,
}: Props) {
  const links = [
    {
      href: "/dashboard/media-owner/upload",
      className: `${cardClass} flex min-h-[120px] flex-col justify-center border-emerald-200/50 bg-white/90 text-center transition-all duration-200 hover:border-emerald-400/60 hover:shadow-md dark:border-emerald-900/30`,
      labelClass: "text-sm font-semibold text-emerald-800 dark:text-emerald-300",
      label: registerLabel,
    },
    {
      href: "/dashboard/media-owner/medias",
      className: `${cardClass} flex min-h-[120px] flex-col justify-center border-sky-200/50 bg-white/90 text-center transition-all duration-200 hover:border-sky-400/60 hover:shadow-md dark:border-sky-900/30`,
      labelClass: "text-sm font-semibold text-blue-700 dark:text-sky-300",
      label: mediasLabel,
    },
    {
      href: "/dashboard/media-owner/inquiries",
      className: `${cardClass} flex min-h-[120px] flex-col justify-center bg-white/90 text-center transition-all duration-200 hover:shadow-md`,
      labelClass: "text-sm font-semibold text-zinc-900 dark:text-zinc-100",
      label: inquiriesLabel,
    },
  ];

  return (
    <>
      <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={l.className}>
            <span className={l.labelClass}>{l.label}</span>
          </Link>
        ))}
      </div>
      <div className="sm:hidden">
        <MobileHorizontalSwipe
          ariaLabel={carouselAriaLabel}
          hint={swipeHint}
          slideBasis="90%"
        >
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={l.className}>
              <span className={l.labelClass}>{l.label}</span>
            </Link>
          ))}
        </MobileHorizontalSwipe>
      </div>
    </>
  );
}
