import { describe, expect, it } from "vitest";
import { createCalculationPdf } from "./pdf-report";

describe("calculation PDF report", () => {
  it("creates a valid PDF with multiple pages for long reports", () => {
    const pdf = createCalculationPdf({
      caseName: "Lang dossier",
      clientName: "Test cliënt",
      calculationVersion: "2026.1",
      normVersion: "2026.1",
      result: {
        totalNeed: 1800,
        transfers: Array.from({ length: 30 }, (_, i) => ({ childIndex: i + 1, direction: "ouder A → ouder B", payment: 250, careDiscount: 100 })),
        warnings: Array.from({ length: 30 }, (_, i) => `Controlepunt ${i + 1}: aanvullende professionele beoordeling nodig.`),
      },
    });
    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Type /Pages");
    expect(text).toContain("/Count 2");
    expect(text).toContain("startxref");
  });
});
