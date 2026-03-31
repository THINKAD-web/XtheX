import { InquiryStripePaymentStatus } from "@prisma/client";

/** 결제가 한 번이라도 완료된 상태(부분 환불 포함). 완전 환불은 제외. */
export function inquiryHasSettledStripePayment(
  status: InquiryStripePaymentStatus | null | undefined,
): boolean {
  return (
    status === InquiryStripePaymentStatus.PAID ||
    status === InquiryStripePaymentStatus.PARTIALLY_REFUNDED
  );
}
