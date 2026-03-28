import { jsPDF } from "jspdf";

export type InquiryContractPdfInput = {
  contractId: string;
  mediaName: string;
  advertiserEmail: string;
  mediaOwnerEmail: string | null;
  agreedBudgetKrw: number | null;
  agreedPeriod: string | null;
  status: string;
  advertiserSignName: string | null;
  advertiserSignedAtIso: string | null;
  mediaOwnerSignName: string | null;
  mediaOwnerSignedAtIso: string | null;
};

function moneyKrw(v: number | null): string {
  if (v == null) return "—";
  return `${v.toLocaleString("en-US")} KRW`;
}

/** English summary PDF (ASCII-safe fonts). Korean UI is separate. */
export function buildInquiryContractPdf(input: InquiryContractPdfInput): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  let y = margin;
  const pageW = doc.internal.pageSize.getWidth();
  const maxW = pageW - margin * 2;

  const addLines = (text: string, size = 10) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += size * 0.45;
    }
    y += 3;
  };

  doc.setFont("helvetica", "bold");
  addLines("XtheX — Media booking agreement (summary)", 14);
  doc.setFont("helvetica", "normal");
  addLines(
    "This PDF is a machine-generated record of agreed terms and e-signatures captured in XtheX. It is not a substitute for legal advice or jurisdiction-specific contracts.",
    9,
  );
  addLines(`Contract record ID: ${input.contractId}`, 10);
  addLines(`Status: ${input.status}`, 10);
  addLines(`Media: ${input.mediaName}`, 10);
  addLines(`Advertiser (account email): ${input.advertiserEmail}`, 10);
  addLines(`Media owner (account email): ${input.mediaOwnerEmail ?? "—"}`, 10);
  addLines(`Agreed budget: ${moneyKrw(input.agreedBudgetKrw)}`, 10);
  addLines(`Agreed period: ${input.agreedPeriod?.trim() || "—"}`, 10);

  y += 4;
  doc.setFont("helvetica", "bold");
  addLines("Signatures (typed name + server timestamp)", 11);
  doc.setFont("helvetica", "normal");
  addLines(
    `Advertiser: ${input.advertiserSignName ?? "—"}  /  ${input.advertiserSignedAtIso ?? "—"}`,
    10,
  );
  addLines(
    `Media owner: ${input.mediaOwnerSignName ?? "—"}  /  ${input.mediaOwnerSignedAtIso ?? "—"}`,
    10,
  );

  y += 6;
  addLines(`Generated at (UTC): ${new Date().toISOString()}`, 9);

  return Buffer.from(doc.output("arraybuffer"));
}
