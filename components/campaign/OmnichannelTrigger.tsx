"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { OmnichannelPopup } from "./OmnichannelPopup";

type Props = {
  mediaId: string;
  locale: string;
  className?: string;
  variant?: "button" | "link";
};

export function OmnichannelTrigger({ mediaId, locale, className, variant = "button" }: Props) {
  const t = useTranslations("omnichannel");
  const [open, setOpen] = React.useState(false);

  if (variant === "link") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={className}
        >
          {t("cta")}
        </button>
        <OmnichannelPopup
          open={open}
          onClose={() => setOpen(false)}
          mediaIds={[mediaId]}
          locale={locale}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "flex w-full items-center justify-center rounded-full border border-orange-500/60 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/10"
        }
      >
        {t("cta")}
      </button>
      <OmnichannelPopup
        open={open}
        onClose={() => setOpen(false)}
        mediaIds={[mediaId]}
        locale={locale}
      />
    </>
  );
}
