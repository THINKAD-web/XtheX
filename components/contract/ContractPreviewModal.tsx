"use client";

import * as React from "react";
import { X, FileText, PenLine, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "@/components/contract/PaymentModal";

export type ContractInquiry = {
  id: string;
  status: "PENDING" | "REPLIED" | "CLOSED";
  message: string;
  desiredPeriod: string | null;
  budget: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAtIso: string;
};

export type ContractMedia = {
  id: string;
  name: string;
  type: string;
  weeklyPriceKrw: number | null;
  locationLabel: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  locale?: string;
  advertiserEmail: string;
  inquiry: ContractInquiry;
  media: ContractMedia;
  onPaid: () => void;
};

function money(v: number | null): string {
  if (v == null) return "—";
  return `${v.toLocaleString()}원`;
}

export function ContractPreviewModal({
  open,
  onClose,
  locale,
  advertiserEmail,
  inquiry,
  media,
  onPaid,
}: Props) {
  const [signed, setSigned] = React.useState(false);
  const [payOpen, setPayOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSigned(false);
      setPayOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const estimatedCost =
    inquiry.budget != null
      ? inquiry.budget
      : media.weeklyPriceKrw != null
        ? media.weeklyPriceKrw
        : null;

  return (
    <>
      <div
        className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center"
        role="dialog"
        aria-modal
        aria-labelledby="contract-title"
      >
        <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-950">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 id="contract-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                계약서 미리보기
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                데모용 계약서입니다. 실제 계약/결제는 추후 연동됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mb-2 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
                <FileText className="h-4 w-4 text-emerald-600" />
                광고주 정보
              </div>
              <p className="text-zinc-700 dark:text-zinc-200">{advertiserEmail}</p>
              <p className="mt-2 text-xs text-zinc-500">
                연락: {inquiry.contactEmail ?? "—"} / {inquiry.contactPhone ?? "—"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mb-2 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
                <FileText className="h-4 w-4 text-blue-600" />
                매체 정보
              </div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{media.name}</p>
              <p className="text-xs uppercase text-zinc-500">{media.type}</p>
              <p className="mt-2 text-xs text-zinc-500">{media.locationLabel}</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">조건 요약</p>
              {inquiry.status === "REPLIED" ? (
                <Badge className="bg-emerald-600 text-white">계약 완료</Badge>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-zinc-500">희망 기간</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {inquiry.desiredPeriod ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">예산</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{money(inquiry.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">예상 비용</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{money(estimatedCost)}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-zinc-500">문의 내용</p>
              <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-200">
                {inquiry.message}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">간단 계약条款 (데모)</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-200">
              <li>광고주는 제공된 소재가 제3자의 권리를 침해하지 않음을 보증합니다.</li>
              <li>매체사는 합의된 기간 동안 해당 매체 지면을 제공하며, 운영상 변동 시 사전 고지합니다.</li>
              <li>결제 완료 후 집행이 확정되며, 취소/환불은 별도 정책에 따릅니다.</li>
              <li>본 계약은 데모이며, 실제 계약은 추후 전자서명/결제 게이트웨이와 연동됩니다.</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={signed ? "secondary" : "outline"}
              className={signed ? "border border-emerald-200" : undefined}
              onClick={() => setSigned(true)}
              disabled={inquiry.status !== "PENDING"}
            >
              <PenLine className="mr-2 h-4 w-4" />
              {signed ? "서명 완료" : "전자서명하기"}
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => setPayOpen(true)}
              disabled={inquiry.status !== "PENDING"}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              결제하기
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      </div>

      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        inquiryId={inquiry.id}
        locale={locale}
        onPaid={onPaid}
      />
    </>
  );
}

