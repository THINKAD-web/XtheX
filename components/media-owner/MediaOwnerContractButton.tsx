"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InquiryContractModal,
  type InquiryContractSummary,
} from "@/components/contract/InquiryContractModal";

type Props = {
  locale: string;
  inquiryId: string;
  contract: InquiryContractSummary;
};

export function MediaOwnerContractButton({ locale, inquiryId, contract }: Props) {
  const t = useTranslations("dashboard.inquiryContract");
  const [open, setOpen] = React.useState(false);

  if (contract == null) {
    return (
      <span className="text-xs text-zinc-500">—</span>
    );
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        {t("open_contract")}
      </Button>
      <InquiryContractModal
        open={open}
        onClose={() => setOpen(false)}
        inquiryId={inquiryId}
        locale={locale}
        viewerRole="media_owner"
      />
    </>
  );
}
