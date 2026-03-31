import { InquiryContractStatus } from "@prisma/client";

export function resolveInquiryCheckoutAmountKrw(inquiry: {
  budget: number | null;
  contract: { agreedBudgetKrw: number | null; status: InquiryContractStatus } | null;
}): number {
  const fromContract =
    inquiry.contract?.status === InquiryContractStatus.COMPLETED &&
    inquiry.contract.agreedBudgetKrw != null
      ? inquiry.contract.agreedBudgetKrw
      : null;
  const base = fromContract ?? inquiry.budget ?? 10_000;
  return Math.max(1_000, Math.min(100_000_000, base));
}
