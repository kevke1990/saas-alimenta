import { NORM_VERSION } from "./norms";
import { calculate, type CaseInput } from "./calculator";
import {
  CALCULATION_CONTRACT_VERSION,
  CALCULATION_ENGINE_V2,
  fingerprintCalculation,
  type CalculationFingerprint,
} from "./calculation-engine-v2";

export type CalculationEngineV2Result = {
  input: CaseInput;
  result: ReturnType<typeof calculate>;
  fingerprint: CalculationFingerprint;
  ruleEngineVersion: string;
};

/** Stable application boundary for Calculation Engine 2.0. */
export function runCalculationEngineV2(input: CaseInput, normVersion = NORM_VERSION): CalculationEngineV2Result {
  if (!normVersion?.trim()) throw new Error("Een normversie is verplicht voor een berekening.");
  const result = calculate(input);
  const fingerprint = fingerprintCalculation(input, result, normVersion);
  return {
    input,
    result,
    fingerprint: { ...fingerprint, engineVersion: CALCULATION_ENGINE_V2, contractVersion: CALCULATION_CONTRACT_VERSION },
    ruleEngineVersion: "1.1.0",
  };
}
