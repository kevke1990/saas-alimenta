import { describe, expect, it } from "vitest";
import { extractDocumentText, MAX_EXTRACTED_CHARS } from "../lib/document-extraction";

describe("document extraction", () => {
  it("extracts and normalizes plain text", async () => {
    const result = await extractDocumentText({ data: Buffer.from("Salaris\r\n€ 4.500 per maand\0"), mimeType: "text/plain" });
    expect(result.status).toBe("COMPLETED");
    expect(result.method).toBe("TEXT");
    expect(result.text).toBe("Salaris\n€ 4.500 per maand");
  });

  it("does not run OCR unless explicitly enabled", async () => {
    const previous = process.env.OCR_ENABLED;
    delete process.env.OCR_ENABLED;
    try {
      const result = await extractDocumentText({ data: Buffer.from("not-an-image"), mimeType: "image/png" });
      expect(result.status).toBe("UNAVAILABLE");
      expect(result.method).toBe("OCR");
    } finally {
      if (previous === undefined) delete process.env.OCR_ENABLED;
      else process.env.OCR_ENABLED = previous;
    }
  });

  it("caps extracted text", async () => {
    const result = await extractDocumentText({ data: Buffer.from("x".repeat(MAX_EXTRACTED_CHARS + 500)), mimeType: "text/plain" });
    expect(result.text).toHaveLength(MAX_EXTRACTED_CHARS);
  });

  it("rejects unsupported local extraction without failing the upload pipeline", async () => {
    const result = await extractDocumentText({ data: Buffer.from("data"), mimeType: "application/octet-stream" });
    expect(result.status).toBe("UNAVAILABLE");
    expect(result.method).toBe("NONE");
    expect(result.text).toBe("");
  });
});
