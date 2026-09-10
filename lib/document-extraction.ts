import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const execFileAsync = promisify(execFile);
export const MAX_EXTRACTED_CHARS = 200_000;

export type ExtractionMethod = "TEXT" | "PDF_TEXT" | "DOCX_TEXT" | "OCR" | "PDF_TEXT_PLUS_OCR" | "NONE";
export type ExtractionStatus = "COMPLETED" | "EMPTY" | "UNAVAILABLE" | "FAILED";

export type DocumentExtraction = {
  text: string;
  method: ExtractionMethod;
  status: ExtractionStatus;
  pages?: number;
  warning?: string;
};

function clamp(text: string) {
  return text.replace(/\u0000/g, "").replace(/\r\n?/g, "\n").trim().slice(0, MAX_EXTRACTED_CHARS);
}

async function ocrImage(filePath: string) {
  const language = process.env.OCR_LANG || "nld+eng";
  const { stdout } = await execFileAsync(process.env.TESSERACT_BIN || "tesseract", [filePath, "stdout", "-l", language, "--psm", "3"], { maxBuffer: 8 * 1024 * 1024 });
  return clamp(stdout);
}

async function ocrPdf(data: Buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "alimenta-ocr-"));
  const input = path.join(tempDir, "document.pdf");
  const prefix = path.join(tempDir, "page");
  try {
    await fs.writeFile(input, data);
    await execFileAsync(process.env.PDFTOPPM_BIN || "pdftoppm", ["-png", "-r", "150", "-f", "1", "-l", "20", input, prefix], { maxBuffer: 2 * 1024 * 1024 });
    const files = (await fs.readdir(tempDir)).filter(f => /^page-\d+\.png$/i.test(f)).sort();
    const pages: string[] = [];
    for (const file of files) pages.push(await ocrImage(path.join(tempDir, file)));
    return clamp(pages.filter(Boolean).join("\n\n"));
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function extractDocumentText(input: { data: Buffer; mimeType: string; name?: string }): Promise<DocumentExtraction> {
  try {
    if (input.mimeType === "text/plain" || input.mimeType === "text/csv") {
      const text = clamp(input.data.toString("utf8"));
      return { text, method: "TEXT", status: text ? "COMPLETED" : "EMPTY" };
    }

    if (input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer: input.data });
      const text = clamp(result.value);
      const warning = result.messages.length ? result.messages.map(m => m.message).join("; ").slice(0, 1000) : undefined;
      return { text, method: "DOCX_TEXT", status: text ? "COMPLETED" : "EMPTY", warning };
    }

    if (input.mimeType === "application/pdf") {
      const result = await pdfParse(input.data);
      const text = clamp(result.text);
      if (text) return { text, method: "PDF_TEXT", status: "COMPLETED", pages: result.numpages };
      if (process.env.OCR_ENABLED === "true") {
        try {
          const ocrText = await ocrPdf(input.data);
          if (ocrText) return { text: ocrText, method: "PDF_TEXT_PLUS_OCR", status: "COMPLETED", pages: result.numpages };
        } catch (ocrError: any) {
          return { text: "", method: "PDF_TEXT_PLUS_OCR", status: "UNAVAILABLE", pages: result.numpages, warning: `PDF-tekst ontbreekt en OCR is niet beschikbaar: ${String(ocrError?.message || ocrError).slice(0, 300)}` };
        }
      }
      return { text: "", method: "PDF_TEXT", status: "EMPTY", pages: result.numpages, warning: "Geen selecteerbare tekst gevonden. Voor scans is OCR vereist." };
    }

    if (["image/jpeg", "image/png", "image/webp"].includes(input.mimeType)) {
      if (process.env.OCR_ENABLED !== "true") return { text: "", method: "OCR", status: "UNAVAILABLE", warning: "OCR_ENABLED is niet ingeschakeld." };
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "alimenta-ocr-"));
      const extension = input.mimeType === "image/png" ? ".png" : input.mimeType === "image/webp" ? ".webp" : ".jpg";
      const inputPath = path.join(tempDir, `document${extension}`);
      try {
        await fs.writeFile(inputPath, input.data);
        const text = await ocrImage(inputPath);
        return { text, method: "OCR", status: text ? "COMPLETED" : "EMPTY" };
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
      }
    }

    return { text: "", method: "NONE", status: "UNAVAILABLE", warning: `Geen lokale tekstextractie voor ${input.mimeType}.` };
  } catch (error: any) {
    return { text: "", method: "NONE", status: "FAILED", warning: String(error?.message || error).slice(0, 500) };
  }
}
