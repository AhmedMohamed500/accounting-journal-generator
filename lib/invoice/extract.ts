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
        const needsOcr = options.forceOcr || compactLength < 80 || invoiceTextScore(embeddedText) < 3;
        if (needsOcr) {
          if (!ocrWorker) {
            const { createWorker } = await import("tesseract.js");
            ocrWorker = await createWorker(["ara", "eng"]);
            await ocrWorker.setParameters({ preserve_interword_spaces: "1" });
          }
          const viewport = page.getViewport({ scale: 2.75 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const canvasContext = canvas.getContext("2d", { alpha: false });
          if (!canvasContext) throw new Error("Canvas is not available for OCR");
          canvasContext.fillStyle = "#ffffff";
          canvasContext.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, canvasContext, viewport }).promise;
          const recognized = await ocrWorker.recognize(canvas);
          const ocrText = recognized.data.text.trim();
          pages.push(invoiceTextScore(ocrText) >= invoiceTextScore(embeddedText) ? ocrText : embeddedText);
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
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(["ara", "eng"], undefined, { logger: (event) => { if (event.status === "recognizing text") onProgress?.(Math.round(event.progress * 100)); } });
  await worker.setParameters({ preserve_interword_spaces: "1" });
  try { const result = await worker.recognize(file); return result.data.text; }
  finally { await worker.terminate(); }
}
