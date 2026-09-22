import { describe, expect, it } from "vitest";
import { buildTremaCaseAudit } from "./trema-case-audit";

const validPayload = {
  referenceYear: 2026,
  need: { ownShareMonthly: 300 },
  parents: [
    { monthlyNbi: 3000, correctedAssistanceNormMonthly: 1500 },
    { monthlyNbi: 2500, correctedAssistanceNormMonthly: 1500 },
  ],
};

describe("buildTremaCaseAudit", () => {
  it("keeps Trema audit-only while attaching a legacy comparison", () => {
    const audit = buildTremaCaseAudit(validPayload, {
      parentResults: [{ capacity: 500 }, { capacity: 300 }],
      totalNeed: 300,
      totalCapacity: 800,
      transfers: [{ payment: 210 }],
    });

    expect(audit.status).toBe("READY");
    expect(audit.rollout.mode).toBe("AUDIT_ONLY");
    expect(audit.rollout.legacyRemainsPrimary).toBe(true);
    expect(audit.rollout.tremaMayDetermineProductionResult).toBe(false);
    expect(audit.comparison).not.toBeNull();
    // Only metrics with identical semantics in both engines are compared.
    // The current comparison contract deliberately exposes the final monthly
    // payable amount; joint capacity and payer-limited contribution are not
    // apples-to-apples metrics and must not be counted here.
    expect(audit.comparison?.comparedMetricCount).toBe(1);
    expect(audit.comparison?.status).toBe("DIFFERENCE");
    expect(audit.warnings).toContain(
      "Het eindbedrag wijkt af tussen de legacy-berekening en de Trema-audit. De legacy-uitkomst blijft leidend.",
    );
  });

  it("does not fail case-audit creation when the legacy result is unavailable", () => {
    const audit = buildTremaCaseAudit(validPayload);

    expect(audit.status).toBe("READY");
    expect(audit.comparison).toBeNull();
    expect(audit.rollout.legacyRemainsPrimary).toBe(true);
  });

  it("reports incomplete Trema input without replacing the legacy production path", () => {
    const audit = buildTremaCaseAudit({
      ...validPayload,
      parents: [
        { monthlyNbi: 3000 },
        { monthlyNbi: 2500 },
      ],
    });

    expect(audit.status).toBe("INPUT_INCOMPLETE");
    expect(audit.result).toBeNull();
    expect(audit.comparison).toBeNull();
    expect(audit.rollout.legacyRemainsPrimary).toBe(true);
    expect(audit.warnings).toContain(
      "De Trema-engine is nog niet leidend; de bestaande berekening blijft actief.",
    );
  });
});
