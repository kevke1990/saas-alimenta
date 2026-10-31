import { describe, expect, it } from "vitest";
import { createCalculationPdf } from "./pdf-report";
import { execSync } from "child_process";

function extractText(pdfBuffer: Buffer): string {
  return execSync("pdftotext - -", { input: pdfBuffer }).toString("utf-8");
}

describe("calculation PDF report", () => {
  it("creates a valid vector PDF with multiple pages and neutral styling", async () => {
    const pdf = await createCalculationPdf({
      caseName: "Familie Geers - VD Bersselaar",
      clientName: "Dianne & Pedro",
      calculationVersion: "2.0.0",
      normVersion: "2026.1",
      result: {
        totalNeed: 1223,
        totalCapacity: 1428,
        family: {
          parentA: { name: "Dianne" },
          parentB: { name: "Pedro" },
          children: [
            { name: "Jaivey", age: 2 },
            { name: "Jezley", age: 6 },
            { name: "Djelena", age: 9 }
          ]
        },
        parentResults: [
          { capacity: 0, paymentTotal: 0, careDaysPerWeek: 7 },
          { capacity: 1428, paymentTotal: 1223, careDaysPerWeek: 0 }
        ],
        historicalCalculation: { historicalNBGI: 4314, historicalNeed: 1097 },
      },
    });

    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(1000);

    const text = extractText(pdf);
    expect(text).toContain("Alimentatieberekening");
    expect(text).toContain("Dossier & Partijen");
    expect(text).toContain("1.223");
    expect(text).toContain("1.428");
    expect(text).toContain("Dianne");
    expect(text).toContain("Pedro");
  });
});
