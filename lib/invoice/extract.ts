import { parseInvoiceText } from "./parser";
export const PDF_WORKER_URL = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type ExtractionOptions = { forceOcr?: boolean };

type PositionedText = { text: string; x: number; y: number };

function invoiceTextScore(text: string) {
  const normalized = text.replace(/\s+/g, " ");
  let score = 0;
  if (/(invoice|فاتورة|فاتوره)/i.test(normalized)) score += 2;
  if (/(supplier|vendor|المورد|البائع)/i.test(normalized)) score += 1;
  if (/(total|amount due|الإجمالي|المجموع|المبلغ المستحق)/i.test(normalized)) score += 1;
  if (/(vat|tax|ضريبة)/i.test(normalized)) score += 1;
  if ((normalized.match(/\d[\d,.]*/g) || []).length >= 3) score += 1;
  return score;
}

function extractionQuality(text: string) {
  const invoice = parseInvoiceText(text);
  const required = ["supplier", "date", "total"].filter((warning) => !invoice.warnings.includes(warning)).length;
  return invoice.confidence + required * 12 + invoice.lines.length * 2 - (invoice.warnings.includes("possibly-not-invoice") ? 80 : 0);
}

function enhanceCanvas(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  const image = context.getImageData(0, 0, canvas.width, canvas.height), data = image.data;
  let total = 0;
  for (let index = 0; index < data.length; index += 4) total += .299 * data[index] + .587 * data[index + 1] + .114 * data[index + 2];
  const average = total / Math.max(1, data.length / 4), threshold = Math.max(145, Math.min(215, average * .92));
  for (let index = 0; index < data.length; index += 4) {
    const gray = .299 * data[index] + .587 * data[index + 1] + .114 * data[index + 2];
    const value = gray < threshold ? Math.max(0, gray * .55) : 255;
    data[index] = value; data[index + 1] = value; data[index + 2] = value; data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

async function imageForOcr(file: File) {
  if (typeof createImageBitmap !== "function") return file;
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height), scale = Math.max(1, Math.min(3, 2800 / Math.max(1, longest)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) { bitmap.close(); return file; }
  context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close(); enhanceCanvas(canvas);
  return canvas;
}

function textFromPdfItems(positioned: PositionedText[]) {
  const rows: Array<{ y: number; items: PositionedText[] }> = [];
  for (const item of positioned) {
    const row = rows.find((current) => Math.abs(current.y - item.y) < 3);
    if (row) row.items.push(item);
    else rows.push({ y: item.y, items: [item] });
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((row) => {
    const joined = row.items.map((item) => item.text).join("");
    const arabic = (joined.match(/[\u0600-\u06ff]/g) || []).length;
    const latin = (joined.match(/[a-z]/gi) || []).length;
    row.items.sort((a, b) => arabic > latin ? b.x - a.x : a.x - b.x);
    return row.items.map((item) => item.text).join("   ");
  }).join("\n");
}

export async function extractTextFromInvoice(file: File, onProgress?: (value: number) => void, options: ExtractionOptions = {}): Promise<string> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data, useWorkerFetch: false, useSystemFonts: true }).promise;
    if (pdf.numPages > 30) throw new Error("Invoice PDF is too long. Upload the invoice pages only (maximum 30 pages).");
    const pages: string[] = [];
    let ocrWorker: Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>> | undefined;
    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const positioned = content.items
          .filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item && "transform" in item)
          .map((item) => ({ text: item.str.trim(), x: item.transform[4] || 0, y: item.transform[5] || 0 }))
          .filter((item) => item.text);
        const embeddedText = textFromPdfItems(positioned);
        const compactLength = embeddedText.replace(/\s/g, "").length;
        const embeddedQuality = extractionQuality(embeddedText);
        const needsOcr = options.forceOcr || compactLength < 100 || invoiceTextScore(embeddedText) < 4 || embeddedQuality < 70;
        if (needsOcr) {
          if (!ocrWorker) {
            const { createWorker, PSM } = await import("tesseract.js");
            ocrWorker = await createWorker(["ara", "eng"]);
            await ocrWorker.setParameters({ preserve_interword_spaces: "1", user_defined_dpi: "300", tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
          }
          const viewport = page.getViewport({ scale: 3.25 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const canvasContext = canvas.getContext("2d", { alpha: false });
          if (!canvasContext) throw new Error("Canvas is not available for OCR");
          canvasContext.fillStyle = "#ffffff";
          canvasContext.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext, viewport }).promise;
          enhanceCanvas(canvas);
          const recognized = await ocrWorker.recognize(canvas);
          const ocrText = recognized.data.text.trim();
          pages.push(extractionQuality(ocrText) >= embeddedQuality ? ocrText : embeddedText);
          canvas.width = 1;
          canvas.height = 1;
        } else pages.push(embeddedText);
        onProgress?.(Math.round(pageNumber / pdf.numPages * 100));
      }
      return pages.join("\n");
    } finally {
      await ocrWorker?.terminate();
    }
  }
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker(["ara", "eng"], undefined, { logger: (event) => { if (event.status === "recognizing text") onProgress?.(Math.round(event.progress * 100)); } });
  await worker.setParameters({ preserve_interword_spaces: "1", user_defined_dpi: "300", tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
  try { const result = await worker.recognize(await imageForOcr(file)); return result.data.text; }
  finally { await worker.terminate(); }
}
