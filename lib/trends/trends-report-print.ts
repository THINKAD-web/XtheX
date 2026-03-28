function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type TrendReportSection = {
  heading: string;
  lines: string[];
};

export function openTrendsReportPrint(args: {
  documentTitle: string;
  reportTitle: string;
  sections: TrendReportSection[];
  footer: string;
}): void {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  const sectionHtml = args.sections
    .map((s) => {
      const lis = s.lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
      return `<section style="margin-bottom:28px;">
  <h2 style="font-size:1.05rem;margin:0 0 10px;border-bottom:1px solid #e5e5e5;padding-bottom:6px;">${escapeHtml(s.heading)}</h2>
  <ul style="margin:0;padding-left:1.25rem;line-height:1.55;">${lis}</ul>
</section>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(args.documentTitle)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #111; }
    h1 { font-size: 1.35rem; margin: 0 0 8px; }
    .sub { color: #555; font-size: 0.9rem; margin-bottom: 28px; }
    .footer { margin-top: 40px; font-size: 0.8rem; color: #777; }
    @media print { body { margin: 20px auto; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(args.reportTitle)}</h1>
  <p class="sub">${escapeHtml(args.documentTitle)}</p>
  ${sectionHtml}
  <p class="footer">${escapeHtml(args.footer)}</p>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}
