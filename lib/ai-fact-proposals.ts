export type AiFactProposal = {
  key: string;
  label: string;
  valueNumber?: number | null;
  valueText?: string | null;
  unit?: string | null;
  confidence: number;
  page?: number | null;
  sourceHint?: string | null;
  status: "PROPOSED";
};

export function buildAiFactProposals(result: unknown): AiFactProposal[] {
  if (!result || typeof result !== "object" || Array.isArray(result)) return [];
  const fields = (result as { fields?: unknown }).fields;
  if (!Array.isArray(fields)) return [];
  return fields.flatMap((field): AiFactProposal[] => {
    if (!field || typeof field !== "object" || Array.isArray(field)) return [];
    const f = field as Record<string, unknown>;
    const key = typeof f.key === "string" ? f.key.trim() : "";
    const label = typeof f.label === "string" ? f.label.trim() : "";
    const confidence = typeof f.confidence === "number" ? f.confidence : NaN;
    if (!key || !label || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) return [];
    return [{ key: key.slice(0, 120), label: label.slice(0, 200), valueNumber: typeof f.valueNumber === "number" && Number.isFinite(f.valueNumber) ? f.valueNumber : null, valueText: typeof f.valueText === "string" ? f.valueText : null, unit: typeof f.unit === "string" ? f.unit.slice(0, 40) : null, confidence, page: Number.isInteger(f.page) && (f.page as number) > 0 ? (f.page as number) : null, sourceHint: typeof f.sourceHint === "string" ? f.sourceHint.slice(0, 500) : null, status: "PROPOSED" }];
  });
}

export function proposalConflicts(proposals: AiFactProposal[]) {
  const byKey = new Map<string, AiFactProposal[]>();
  for (const proposal of proposals) byKey.set(proposal.key, [...(byKey.get(proposal.key) ?? []), proposal]);
  return [...byKey.entries()].filter(([, list]) => new Set(list.map((x) => `${x.valueNumber ?? ""}|${x.valueText ?? ""}|${x.unit ?? ""}`)).size > 1).map(([key, list]) => ({ key, count: list.length }));
}
