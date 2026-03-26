"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { OmnichannelPopup } from "@/components/campaign/OmnichannelPopup";

type Props = {
  locale: string;
  mediaIds: string[];
};

export function CampaignSelectionDraftCta({ locale, mediaIds }: Props) {
  const t = useTranslations("dashboard.advertiser.recommendationsV2");
  const [open, setOpen] = React.useState(false);

  if (mediaIds.length === 0) return null;

  return (
    <>
      <Button
        type="button"
        className="mt-4 bg-blue-600 text-white hover:bg-blue-500"
        onClick={() => setOpen(true)}
      >
        {t("save_draft_with_selected")}
      </Button>
      <OmnichannelPopup
        open={open}
        onClose={() => setOpen(false)}
        mediaIds={mediaIds}
        locale={locale}
      />
    </>
  );
}
