import { describe, expect, it } from "vitest";
import { createCalculationPdf } from "../lib/pdf-report";
import { execSync } from "child_process";

function extractText(pdfBuffer: Buffer): string {
  return execSync("pdftotext - -", { input: pdfBuffer }).toString("utf-8");
}

describe("PDF Export Logic", () => {
  it("renders a DRAFT state when draft is true", async () => {
    const pdfBuffer = await createCalculationPdf({
      draft: true,
      title: "Alimentatieberekening",
      calculationVersion: "2026.1",
      normVersion: "2026.1",
      result: {
        totalNeed: 500,
      },
    });

    const text = extractText(pdfBuffer);
    expect(text).toContain("CONCEPT / NIET GOEDGEKEURD");
    expect(text).toContain("LET OP: Deze berekening is een CONCEPT en is NIET GOEDGEKEURD.");
  });

  it("renders an APPROVED state when draft is false", async () => {
    const pdfBuffer = await createCalculationPdf({
      draft: false,
      title: "Alimentatieberekening",
      calculationVersion: "2026.1",
      normVersion: "2026.1",
      result: {
        totalNeed: 500,
      },
    });

    const text = extractText(pdfBuffer);
    expect(text).toContain("Alimentatieberekening");
    expect(text).toContain("DEFINITIEF AKKOORD");
    expect(text).not.toContain("CONCEPT / NIET GOEDGEKEURD");
    expect(text).not.toContain("LET OP: Deze berekening is een CONCEPT");
  });
});
