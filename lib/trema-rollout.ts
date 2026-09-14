/** Controlled rollout policy for the Trema 2026 engine.
 *
 * Phase 2 starts in audit-only mode. The legacy calculator remains the
 * production source until explicit validation and activation criteria are met.
 */

export type TremaRolloutMode = "AUDIT_ONLY" | "COMPARE" | "CONTROLLED_PRIMARY" | "PRIMARY";

export type TremaRolloutDecision = {
  mode: TremaRolloutMode;
  legacyRemainsPrimary: boolean;
  tremaMayDetermineProductionResult: boolean;
  reason: string;
};

export function getTremaRolloutDecision(
  mode: TremaRolloutMode = "AUDIT_ONLY",
): TremaRolloutDecision {
  if (mode === "PRIMARY") {
    return {
      mode,
      legacyRemainsPrimary: false,
      tremaMayDetermineProductionResult: true,
      reason: "Trema 2026 is explicitly activated as the primary engine.",
    };
  }

  if (mode === "CONTROLLED_PRIMARY") {
    return {
      mode,
      legacyRemainsPrimary: false,
      tremaMayDetermineProductionResult: true,
      reason: "Trema 2026 may determine production results only for an explicitly controlled rollout cohort.",
    };
  }

  return {
    mode,
    legacyRemainsPrimary: true,
    tremaMayDetermineProductionResult: false,
    reason:
      mode === "COMPARE"
        ? "Trema 2026 is used for comparison only; the legacy result remains authoritative."
        : "Trema 2026 is used for audit only; the legacy result remains authoritative.",
  };
}
