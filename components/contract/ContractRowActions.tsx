"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ContractPreviewModal,
  type ContractInquiry,
  type ContractMedia,
} from "@/components/contract/ContractPreviewModal";

type Props = {
  locale: string;
  advertiserEmail: string;
  inquiry: ContractInquiry;
  media: ContractMedia;
};

export function ContractRowActions({ locale, advertiserEmail, inquiry, media }: Props) {
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState(inquiry.status);

  React.useEffect(() => {
    setStatus(inquiry.status);
  }, [inquiry.status]);

  if (status !== "PENDING") {
    return (
      <span className="inline-flex rounded-full bg-emerald-600/10 px-2 py-1 text-xs font-medium text-emerald-800">
        계약 완료
      </span>
    );
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        계약서 보기
      </Button>

      <ContractPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        locale={locale}
        advertiserEmail={advertiserEmail}
        inquiry={{ ...inquiry, status }}
        media={media}
        onPaid={() => {
          setStatus("REPLIED");
          toast.success("🎉 계약이 완료되었습니다!");
        }}
      />
    </>
  );
}

