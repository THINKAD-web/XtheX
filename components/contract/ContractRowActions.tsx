"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InquiryContractModal,
  type InquiryContractSummary,
} from "@/components/contract/InquiryContractModal";

type InquiryLite = {
  id: string;
  status: "PENDING" | "REPLIED" | "CLOSED";
};

type Props = {
  locale: string;
  inquiry: InquiryLite;
  contract: InquiryContractSummary;
};

export function ContractRowActions({
  locale,
  inquiry,
  contract: contractProp,
}: Props) {
  const t = useTranslations("dashboard.inquiryContract");
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [inquiryStatus, setInquiryStatus] = React.useState(inquiry.status);
  const [contract, setContract] = React.useState(contractProp);

  React.useEffect(() => {
    setInquiryStatus(inquiry.status);
  }, [inquiry.status]);

  React.useEffect(() => {
    setContract(contractProp);
  }, [contractProp]);

  const legacyPaid = inquiryStatus === "REPLIED" && contract == null;
  const showCompleteBadge =
    contract?.status === "COMPLETED" || legacyPaid;

  if (inquiryStatus === "CLOSED") {
    return (
      <span className="inline-flex rounded-full bg-zinc-600/10 px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {t("badge_closed")}
      </span>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {showCompleteBadge ? (
          <span className="inline-flex w-fit rounded-full bg-emerald-600/10 px-2 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200">
            {t("badge_complete")}
          </span>
        ) : contract != null ? (
          <span className="inline-flex w-fit rounded-full bg-sky-600/10 px-2 py-1 text-xs font-medium text-sky-900 dark:text-sky-200">
            {t("badge_in_progress")}
          </span>
        ) : null}
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          <FileText className="mr-2 h-4 w-4" />
          {t("open_contract")}
        </Button>
      </div>

      <InquiryContractModal
        open={open}
        onClose={() => setOpen(false)}
        inquiryId={inquiry.id}
        locale={locale}
        viewerRole="advertiser"
        onPaid={() => {
          setInquiryStatus("REPLIED");
          router.refresh();
        }}
      />
    </>
  );
}
