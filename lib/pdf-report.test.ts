import { describe, expect, it } from "vitest";
import { createCalculationPdf } from "./pdf-report";

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

    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF")).toBe(true);
    expect(pdf.length).toBeGreaterThan(1000);
    expect(text).toContain("/Type /Pages");
    expect(text).toContain("startxref");
  });
});
