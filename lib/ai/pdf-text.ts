import { join } from "path";

/**
 * PDF 바이너리에서 텍스트만 추출 (서버 전용, pdfjs legacy 빌드).
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  );
  GlobalWorkerOptions.workerSrc = join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
  );

  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });
  const doc = await loadingTask.promise;
  const parts: string[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (typeof item === "object" && item !== null && "str" in item) {
        const s = (item as { str: string }).str;
        if (s?.trim()) parts.push(s);
      }
    }
    parts.push("\n");
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 5 && buf.slice(0, 5).toString("ascii") === "%PDF-";
}
