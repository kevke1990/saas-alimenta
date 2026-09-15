/** Safe integration boundary for the Trema 2026 engine.
 *
 * The audit layer is deliberately non-blocking: incomplete legacy wizard data
 * is reported as INPUT_INCOMPLETE instead of breaking case creation.
 */
import { adaptAlimentaForm, type AlimentaFormPayload } from "./alimentatie-engine-adapter";
import { calculateTrema2026 } from "./alimentatie-engine-trema-2026";
import { compareLegacyWithTrema, type TremaComparison } from "./trema-comparison";
import { normalizeLegacyResultForTrema } from "./trema-legacy-normalizer";
import { getTremaRolloutDecision } from "./trema-rollout";

export type TremaCaseAuditStatus = "READY" | "INPUT_INCOMPLETE" | "ERROR";

export type TremaCaseAudit = {
  engine: "trema-2026";
  rollout: ReturnType<typeof getTremaRolloutDecision>;
  status: TremaCaseAuditStatus;
  missingFields: string[];
  warnings: string[];
  result: ReturnType<typeof calculateTrema2026> | null;
  comparison: TremaComparison | null;
};

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Onbekende Trema-enginefout.";
}

export function buildTremaCaseAudit(
  payload: unknown,
  legacyResult: unknown = null,
): TremaCaseAudit {
  const rollout = getTremaRolloutDecision("AUDIT_ONLY");
  try {
    const input = adaptAlimentaForm(payload as AlimentaFormPayload);
    const result = calculateTrema2026(input);
    const normalizedLegacy = normalizeLegacyResultForTrema(legacyResult);
    const comparison = normalizedLegacy === null ? null : compareLegacyWithTrema(normalizedLegacy, result);
    return {
      engine: "trema-2026",
      rollout,
      status: "READY",
      missingFields: [],
      warnings: [...(result.warnings ?? []), ...(comparison?.warnings ?? [])],
      result,
      comparison,
    };
  } catch (error) {
    const message = messageOf(error);
    const incomplete = /ontbreekt|moet groter zijn|uitsluitend peiljaar|geldige/i.test(message);
    return {
      engine: "trema-2026",
      rollout,
      status: incomplete ? "INPUT_INCOMPLETE" : "ERROR",
      missingFields: incomplete ? [message] : [],
      warnings: incomplete ? ["De Trema-engine is nog niet leidend; de bestaande berekening blijft actief."] : [],
      result: null,
      comparison: null,
    };
  }
}
