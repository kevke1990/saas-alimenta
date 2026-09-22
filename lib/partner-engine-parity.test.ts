import { describe, expect, it } from "vitest";
import { calculatePartnerSupport as calculateLegacyRoutePAL } from "./partner-engine";
import { calculatePartnerSupport as calculateCanonicalPAL } from "./partner-calculator";

describe("PAL engine parity regression", () => {
  const fixtures = [
    { year: 2024 as const, expectedCapacity: 984 },
    { year: 2025 as const, expectedCapacity: 960 },
    { year: 2026 as const, expectedCapacity: 927 },
  ];

  it.each(fixtures)("keeps the route and canonical PAL engines aligned for %s", ({ year, expectedCapacity }) => {
    const legacy = calculateLegacyRoutePAL({
      historicalNBGI: 5548,
      historicalChildCosts: 808,
      currentRecipientNBI: 1763,
      currentPayerNBI: 4156,
      currentChildSupport: 808,
      normYear: year,
    });

    const canonical = calculateCanonicalPAL({
      marriageNBGI: 5548,
      childShareDuringMarriage: 808,
      payer: { nbi: 4156 },
      recipientCurrentNBI: 1763,
      payerChildSupportShare: 808,
      normYear: year,
    });

    expect(legacy.normVersion).toBe(canonical.normVersion);
    expect(legacy.capacity.base).toBe(expectedCapacity);
    expect(canonical.payerCapacityBeforeChildren).toBe(expectedCapacity);
    expect(legacy.capacity.remainingNet).toBe(canonical.payerRemainingCapacity);
    expect(legacy.result.monthlyNet).toBe(canonical.netPartnerSupport);
  });
});
