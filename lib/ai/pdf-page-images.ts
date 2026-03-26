/**
 * PDF 페이지 → PNG(base64) for Grok Vision.
 * pdfjs-dist(legacy) + node-canvas + sharp (1024 이하, 압축).
 */
import { join } from "path";

/** 이미지·매체 관련 키워드 (우선 렌더) */
const PAGE_IMAGE_HINT =
  /사진|이미지|샘플|현장|시안|레퍼런스|LED|디지털|전광|사이니지|캡처|지도|layout|도면|매체|전경|야경|노출\s*사진|구성\s*도|위치\s*도|표|단가|CPM|노출수|portfolio|gallery|map|photo|reference/i;

export type PdfVisionPageImage = {
  pageNumber: number;
  mime: string;
  base64: string;
  /** Supabase 업로드용 (base64와 동일 픽셀) */
  uploadBuffer: Buffer;
};

async function loadPdfDoc(buffer: Buffer) {
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
  return loadingTask.promise;
}

async function getPageTextAndItemCount(page: {
  getTextContent: () => Promise<{ items: unknown[] }>;
}): Promise<{ text: string; itemCount: number }> {
  const content = await page.getTextContent();
  const parts: string[] = [];
  for (const item of content.items) {
    if (typeof item === "object" && item !== null && "str" in item) {
      const s = (item as { str: string }).str;
      if (s?.trim()) parts.push(s);
    }
  }
  const text = parts.join(" ");
  return { text, itemCount: content.items.length };
}

/** 테이블·도표 의심: 텍스트 조각 다수 또는 숫자 밀도 */
function tableChartScore(text: string, itemCount: number): number {
  let s = 0;
  if (itemCount >= 45) s += 5;
  if (itemCount >= 80) s += 3;
  const digitTokens = text.match(/\d[\d,.,]*\s*%?/g) ?? [];
  if (digitTokens.length >= 18) s += 4;
  if (/\d+\s*[~～-]\s*\d+/.test(text)) s += 2;
  if (/표\s*\d|Figure|그림\s*\d|단가표|견적/i.test(text)) s += 3;
  return s;
}

function keywordScore(text: string): number {
  let s = 0;
  if (/현장사진|현장\s*사진/i.test(text)) s += 10;
  if (/사진|이미지|샘플|현장/i.test(text)) s += 8;
  if (/LED|디지털|전광|사이니지/i.test(text)) s += 6;
  if (/지도|위치\s*도|구성\s*도/i.test(text)) s += 5;
  if (PAGE_IMAGE_HINT.test(text)) s += 2;
  return s;
}

async function compressForVision(buf: Buffer): Promise<{
  buf: Buffer;
  mime: string;
}> {
  const sharp = (await import("sharp")).default;
  const resized = sharp(buf).resize(1024, 1024, {
    fit: "inside",
    withoutEnlargement: true,
  });
  if (process.env.PDF_VISION_PNG === "1") {
    const png = await resized.png({ compressionLevel: 8, effort: 6 }).toBuffer();
    return { buf: png, mime: "image/png" };
  }
  const jpeg = await resized.jpeg({ quality: 75, mozjpeg: true }).toBuffer();
  return { buf: jpeg, mime: "image/jpeg" };
}

/**
 * 키워드·테이블 의심 페이지 우선, 최대 maxVisionPages장(기본 8) PNG.
 */
export async function renderPdfPagesForVision(
  buffer: Buffer,
  options?: {
    maxVisionPages?: number;
  },
): Promise<PdfVisionPageImage[]> {
  const { createCanvas } = await import("canvas");
  const envMax = Number(process.env.PDF_VISION_MAX_PAGES);
  const defaultMax = Math.min(8, options?.maxVisionPages ?? 8);
  const effectiveMax = Number.isFinite(envMax)
    ? Math.min(8, Math.max(1, envMax))
    : defaultMax;

  const doc = await loadPdfDoc(buffer);
  const numPages = doc.numPages;
  if (numPages < 1) return [];

  const meta: Array<{
    page: number;
    text: string;
    kw: number;
    tbl: number;
  }> = [];

  for (let p = 1; p <= numPages; p++) {
    const page = await doc.getPage(p);
    const { text, itemCount } = await getPageTextAndItemCount(page);
    meta.push({
      page: p,
      text,
      kw: keywordScore(text),
      tbl: tableChartScore(text, itemCount),
    });
  }

  const byPriority = [...meta].sort((a, b) => {
    const sa = a.kw * 10 + a.tbl;
    const sb = b.kw * 10 + b.tbl;
    if (sb !== sa) return sb - sa;
    return a.page - b.page;
  });

  const ordered: number[] = [];
  const seen = new Set<number>();
  const push = (pn: number) => {
    if (pn < 1 || pn > numPages || seen.has(pn)) return;
    if (ordered.length >= effectiveMax) return;
    ordered.push(pn);
    seen.add(pn);
  };

  for (const m of byPriority) push(m.page);
  for (let p = 1; p <= Math.min(3, numPages); p++) push(p);
  for (let p = 1; p <= numPages && ordered.length < effectiveMax; p++) push(p);

  const selected = ordered.slice(0, effectiveMax);
  const out: PdfVisionPageImage[] = [];

  for (const pageNum of selected) {
    try {
      const page = await doc.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(
        2.25,
        1400 / Math.max(baseViewport.width, baseViewport.height, 1),
      );
      const viewport = page.getViewport({ scale });
      const w = Math.floor(viewport.width);
      const h = Math.floor(viewport.height);
      if (w < 1 || h < 1 || w > 8000 || h > 8000) continue;

      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      await (
        page as unknown as {
          render: (p: Record<string, unknown>) => { promise: Promise<void> };
        }
      )
        .render({ canvasContext: ctx, viewport })
        .promise;

      const rawPng = canvas.toBuffer("image/png");
      const { buf: outBuf, mime } = await compressForVision(rawPng);

      out.push({
        pageNumber: pageNum,
        mime,
        base64: outBuf.toString("base64"),
        uploadBuffer: outBuf,
      });
    } catch (e) {
      console.warn(
        `[pdf-page-images] 페이지 ${pageNum} 렌더 실패:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  if (out.length > 0) {
    console.log(
      `[pdf-page-images] Vision ${out[0]?.mime === "image/jpeg" ? "JPEG(q75)" : "PNG"} ${out.length}장 / ${numPages}페이지:`,
      out.map((o) => o.pageNumber).join(", "),
    );
  }
  return out;
}
