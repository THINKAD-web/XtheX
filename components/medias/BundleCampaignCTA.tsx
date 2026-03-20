"use client";

import * as React from "react";
import { OmnichannelPopup } from "@/components/campaign/OmnichannelPopup";
import { Button } from "@/components/ui/button";

type Props = {
  locale: string;
  mediaIds: string[];
};

export function BundleCampaignCTA({ locale, mediaIds }: Props) {
  const isKo = locale === "ko";
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-orange-500/50 bg-orange-500/10 text-orange-200 hover:bg-orange-500/20"
        onClick={() => setOpen(true)}
      >
        {isKo ? "이 조합으로 캠페인 만들기" : "Create campaign with this bundle"}
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

