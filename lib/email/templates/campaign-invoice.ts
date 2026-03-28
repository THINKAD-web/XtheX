function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function campaignInvoiceIssuedHtml(p: {
  campaignTitle: string;
  amountKrw: number;
  campaignEndAtIso: string;
  dueAtIso: string;
  invoiceId: string;
  dashboardUrl: string | null;
}): string {
  const amount = p.amountKrw.toLocaleString("ko-KR");
  const link = p.dashboardUrl
    ? `<p><a href="${esc(p.dashboardUrl)}">Open invoices in dashboard</a></p>`
    : "";
  return `
<p>Hello,</p>
<p>A campaign has ended and an invoice has been issued on XtheX.</p>
<ul>
  <li><strong>Campaign:</strong> ${esc(p.campaignTitle)}</li>
  <li><strong>Amount:</strong> ${esc(amount)} KRW</li>
  <li><strong>Campaign end (UTC):</strong> ${esc(p.campaignEndAtIso)}</li>
  <li><strong>Payment due (UTC):</strong> ${esc(p.dueAtIso)}</li>
  <li><strong>Invoice ID:</strong> ${esc(p.invoiceId)}</li>
</ul>
<p>Please arrange payment by the due date.</p>
${link}
<p style="color:#64748b;font-size:14px">This is an automated message from XtheX.</p>
`.trim();
}

export function campaignInvoiceReminderHtml(p: {
  campaignTitle: string;
  amountKrw: number;
  dueAtIso: string;
  invoiceId: string;
  variant: "before_due" | "overdue";
  dashboardUrl: string | null;
}): string {
  const amount = p.amountKrw.toLocaleString("ko-KR");
  const link = p.dashboardUrl
    ? `<p><a href="${esc(p.dashboardUrl)}">Open invoices in dashboard</a></p>`
    : "";
  const lead =
    p.variant === "overdue"
      ? `<p><strong>Your invoice is past due.</strong> Please pay as soon as possible.</p>`
      : `<p><strong>Payment reminder:</strong> your invoice is due soon.</p>`;
  return `
${lead}
<ul>
  <li><strong>Campaign:</strong> ${esc(p.campaignTitle)}</li>
  <li><strong>Amount:</strong> ${esc(amount)} KRW</li>
  <li><strong>Due (UTC):</strong> ${esc(p.dueAtIso)}</li>
  <li><strong>Invoice ID:</strong> ${esc(p.invoiceId)}</li>
</ul>
${link}
<p style="color:#64748b;font-size:14px">XtheX automated billing notice.</p>
`.trim();
}
