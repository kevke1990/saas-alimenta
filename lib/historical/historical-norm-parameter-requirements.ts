import type { HistoricalNormParameterKey } from "./historical-norm-parameter-registry";

/**
 * Required source artifacts for an executable historical period.
 * This is a verification contract, not a financial dataset: values remain
 * blocked until extracted from the official publication and independently
 * reviewed.
 */
export type HistoricalParameterArtifact = {
  key: HistoricalNormParameterKey;
  description: string;
  required: true;
};

export const HISTORICAL_PARAMETER_ARTIFACTS: readonly HistoricalParameterArtifact[] = [
  { key: "tableAmount", description: "Officiële behoeftetabel/eigen aandeel kosten kinderen.", required: true },
  { key: "childBudget", description: "Onderliggende kindbudget-/behoefte-inputs zoals voorgeschreven voor de periode.", required: true },
  { key: "incomeTaxParameters", description: "Fiscale tarieven en heffingskortingen die door het historische rekenmodel worden gebruikt.", required: true },
  { key: "socialPremiumParameters", description: "Premies/verzekeringsparameters die in het historische model relevant zijn.", required: true },
  { key: "minimumIncome", description: "Historisch minimum/draagkrachtloos inkomen of equivalente norminput.", required: true },
  { key: "careReduction", description: "Historische zorgkortingspercentages en toepassingsregels.", required: true },
  { key: "otherRequiredNormInputs", description: "Overige verplichte inputs uit rapport en bijlagen.", required: true },
];

export function getRequiredHistoricalParameterKeys(): readonly HistoricalNormParameterKey[] {
  return HISTORICAL_PARAMETER_ARTIFACTS.map((artifact) => artifact.key);
}
