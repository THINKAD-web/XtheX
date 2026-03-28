import type { BillingDemoTx } from "@/lib/billing/demo-data";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type PrintInvoiceArgs = {
  companyName: string;
  invoiceTitle: string;
  invoiceIdLabel: string;
  dateLabel: string;
  descLabel: string;
  amountLabel: string;
  statusLabel: string;
  paidLabel: string;
  pendingLabel: string;
  footerNote: string;
  tx: BillingDemoTx;
  description: string;
  amountDisplay: string;
};

export function openInvoicePrintWindow(args: PrintInvoiceArgs): void {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  const statusText =
    args.tx.status === "PAID" ? args.paidLabel : args.pendingLabel;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(args.tx.invoiceId)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 48px auto; padding: 0 24px; color: #111; }
    h1 { font-size: 1.5rem; margin: 0 0 8px; }
    .meta { color: #555; font-size: 0.9rem; margin-bottom: 32px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e5e5e5; }
    th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: #666; }
    .total { font-weight: 600; font-size: 1.1rem; margin-top: 24px; }
    .footer { margin-top: 48px; font-size: 0.8rem; color: #777; }
    @media print { body { margin: 24px auto; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(args.invoiceTitle)}</h1>
  <div class="meta">${escapeHtml(args.companyName)} · ${escapeHtml(args.invoiceIdLabel)}: ${escapeHtml(args.tx.invoiceId)}</div>
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(args.dateLabel)}</th>
        <th>${escapeHtml(args.descLabel)}</th>
        <th>${escapeHtml(args.amountLabel)}</th>
        <th>${escapeHtml(args.statusLabel)}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(args.tx.date)}</td>
        <td>${escapeHtml(args.description)}</td>
        <td>${escapeHtml(args.amountDisplay)}</td>
        <td>${escapeHtml(statusText)}</td>
      </tr>
    </tbody>
  </table>
  <p class="total">${escapeHtml(args.amountLabel)}: ${escapeHtml(args.amountDisplay)}</p>
  <p class="footer">${escapeHtml(args.footerNote)}</p>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}
