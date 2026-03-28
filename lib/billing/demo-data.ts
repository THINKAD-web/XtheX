export type BillingTxStatus = "PAID" | "PENDING";

export type BillingDemoTx = {
  id: string;
  invoiceId: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  /** i18n key under billing.tx_* */
  descKey: string;
  /** Amount stored in KRW for demo consistency */
  amountKrw: number;
  status: BillingTxStatus;
};

export const BILLING_DEMO_TRANSACTIONS: BillingDemoTx[] = [
  {
    id: "1",
    invoiceId: "INV-2026-0312",
    date: "2026-03-12",
    descKey: "tx_ooh_booking",
    amountKrw: 4_200_000,
    status: "PAID",
  },
  {
    id: "2",
    invoiceId: "INV-2026-0301",
    date: "2026-03-01",
    descKey: "tx_platform_fee",
    amountKrw: 210_000,
    status: "PAID",
  },
  {
    id: "3",
    invoiceId: "INV-2026-0220",
    date: "2026-02-20",
    descKey: "tx_creative_review",
    amountKrw: 180_000,
    status: "PAID",
  },
  {
    id: "4",
    invoiceId: "INV-2026-0328",
    date: "2026-03-28",
    descKey: "tx_pending_campaign",
    amountKrw: 3_850_000,
    status: "PENDING",
  },
  {
    id: "5",
    invoiceId: "INV-2026-0325",
    date: "2026-03-25",
    descKey: "tx_addon_analytics",
    amountKrw: 95_000,
    status: "PENDING",
  },
];

export type BillingPaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  exp: string;
  isDefault: boolean;
};

export const BILLING_DEMO_PAYMENT_METHODS: BillingPaymentMethod[] = [
  { id: "pm_1", brand: "Visa", last4: "4242", exp: "08/27", isDefault: true },
  { id: "pm_2", brand: "Mastercard", last4: "1881", exp: "11/26", isDefault: false },
];
