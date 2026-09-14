/** Safe integration boundary for the Trema 2026 engine.
 *
 * The audit layer is deliberately non-blocking: incomplete legacy wizard data
 * is reported as INPUT_INCOMPLETE instead of breaking case creation.
 */
import { adaptAlimentaForm, type AlimentaFormPayload } from "@/lib/alimentatie-engine-adapter";
import { calculateTrema2026 } from "@/lib/alimentatie-engine-trema-2026";

export type TremaCaseAuditStatus = "READY" | "INPUT_INCOMPLETE" | "ERROR";

export type TremaCaseAudit = {
  engine: "trema-2026";
  status: TremaCaseAuditStatus;
  missingFields: string[];
  warnings: string[];
  result: ReturnType<typeof calculateTrema2026> | null;
};

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Onbekende Trema-enginefout.";
}

export function buildTremaCaseAudit(payload: unknown): TremaCaseAudit {
  try {
    const input = adaptAlimentaForm(payload as AlimentaFormPayload);
    const result = calculateTrema2026(input);
    return {
      engine: "trema-2026",
      status: "READY",
      missingFields: [],
      warnings: result.warnings ?? [],
      result,
    };
  } catch (error) {
    const message = messageOf(error);
    const incomplete = /ontbreekt|moet groter zijn|uitsluitend peiljaar|geldige/i.test(message);
    return {
      engine: "trema-2026",
      status: incomplete ? "INPUT_INCOMPLETE" : "ERROR",
      missingFields: incomplete ? [message] : [],
      warnings: incomplete ? ["De Trema-engine is nog niet leidend; de bestaande berekening blijft actief."] : [],
      result: null,
    };
  }
}
