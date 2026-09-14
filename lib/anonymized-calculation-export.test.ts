import { describe, expect, it } from "vitest";
import {
  anonymizeCalculationInput,
  buildAnonymizedCalculationExport,
  validateCalculationConsistency,
} from "./anonymized-calculation-export";

describe("anonymized calculation export", () => {
  it("removes direct identifiers while retaining numeric calculation values", () => {
    const result = anonymizeCalculationInput({
      parentName: "Jan Jansen",
      childName: "Emma Jansen",
      email: "jan@example.com",
      ipAddress: "192.168.1.20",
      caseId: "case-secret",
      monthlyAmount: 556,
      percentage: 15,
    }) as Record<string, unknown>;

    expect(result.parentName).toBe("Ouder A");
    expect(result.childName).toBe("Kind 1");
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("ipAddress");
    expect(result).not.toHaveProperty("caseId");
    expect(result.monthlyAmount).toBe(556);
    expect(result.percentage).toBe(15);
  });

  it("creates a clearly marked export with warnings and metadata", () => {
    const result = buildAnonymizedCalculationExport({
      input: { parentName: "Jan Jansen" },
      calculation: { payment: 556, formula: "686 - 130 = 556" },
      normVersion: "2026.1",
      engineVersion: "1.2.0",
      reviewStatus: "INCOMPLETE",
      warnings: [{ field: "income", currentValue: 3350, reason: "controle", possibleImpact: "mogelijk effect" }],
    });

    expect(result.notice).toContain("GEANONIMISEERD");
    expect(result.disclaimer).toContain("geen juridisch advies");
    expect(result.normVersion).toBe("2026.1");
    expect(result.calculation).toEqual({ payment: 556, formula: "Geanonimiseerde naam" });
    expect(result.warnings).toHaveLength(1);
  });

  it("detects inconsistent income, care, partner and formula input", () => {
    const warnings = validateCalculationConsistency({
      income: [{ field: "ouderB", mode: "GROSS", grossAnnual: 0, netMonthly: 3350 }],
      careDaysPerYear: 20,
      carePercentage: 15,
      partnerEntered: true,
      partnerImpactExplained: false,
      formulaOutputPresent: false,
      reviewStatus: "CONCEPT",
    });

    expect(warnings.map((warning) => warning.field)).toEqual(expect.arrayContaining([
      "ouderB",
      "ouderB.mode",
      "carePercentage",
      "partner",
      "calculation.formula",
      "reviewStatus",
    ]));
  });
});
