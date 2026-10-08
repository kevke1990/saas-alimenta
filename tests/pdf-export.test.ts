import { describe, expect, it } from "vitest";
import { createCalculationPdf } from "../lib/pdf-report";

describe("PDF Export Logic", () => {
  it("renders a DRAFT state when draft is true", () => {
    const pdfBuffer = createCalculationPdf({
      draft: true,
      title: "Merelo – Alimentatieberekening",
      calculationVersion: "2026.1",
      normVersion: "2026.1",
      result: {
        totalNeed: 500,
      },
    });

    const pdfText = pdfBuffer.toString('latin1');
    expect(pdfText).toContain("CONCEPT / NIET GOEDGEKEURD");
    expect(pdfText).toContain("LET OP: Deze berekening is een CONCEPT en is NIET GOEDGEKEURD.");
  });

  it("renders an APPROVED state when draft is false", () => {
    const pdfBuffer = createCalculationPdf({
      draft: false,
      title: "Merelo – Alimentatieberekening",
      calculationVersion: "2026.1",
      normVersion: "2026.1",
      result: {
        totalNeed: 500,
      },
    });

    const pdfText = pdfBuffer.toString('latin1');
    // Escaping replaced the en-dash in the PDF output with a question mark in latin1 Buffer
    expect(pdfText).toContain("Merelo ? Alimentatieberekening");
    expect(pdfText).not.toContain("CONCEPT / NIET GOEDGEKEURD");
    expect(pdfText).not.toContain("LET OP: Deze berekening is een CONCEPT");
  });
});
