export type WorkScoreInput = {
  reviewStatus: string;
  calculationCount: number;
  proposedIncomeFacts: number;
  documentsAwaitingReview: number;
  documentAnalysisErrors: number;
  calculationStale?: boolean;
  largeCalculationChange?: boolean;
  overdueTasks?: number;
  todayTasks?: number;
};

export type WorkScore = {
  score: number;
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  reasons: string[];
};

export function hasLargeCalculationChange(latestResult: unknown, previousResult: unknown, threshold = 0.25): boolean {
  const readAmount = (value: unknown): number | null => {
    if (!value || typeof value !== "object") return null;
    const root = value as Record<string, unknown>;
    const combined = root.combined;
    const combinedAmount = combined && typeof combined === "object" ? Number((combined as Record<string, unknown>).totalMonthlyPayments) : NaN;
    const totalNeed = Number(root.totalNeed);
    const fallback = Number(root.totalMonthlyPayments);
    const amount = Number.isFinite(combinedAmount) ? combinedAmount : Number.isFinite(totalNeed) ? totalNeed : fallback;
    return Number.isFinite(amount) && amount >= 0 ? amount : null;
  };
  const latest = readAmount(latestResult);
  const previous = readAmount(previousResult);
  if (latest === null || previous === null || previous === 0) return false;
  return Math.abs(latest - previous) / previous >= threshold;
}

/** Deterministic professional work-priority score; never a legal judgement or calculation input. */
export function calculateWorkScore(input: WorkScoreInput): WorkScore {
  let score = 100;
  const reasons: string[] = [];
  const reviewPenalty: Record<string, number> = { INCOMPLETE: 10, READY_FOR_REVIEW: 25, REVIEWED: 15, APPROVED: 5, FINAL: 0 };
  score -= reviewPenalty[input.reviewStatus] ?? 10;
  if (input.reviewStatus === "INCOMPLETE") reasons.push("Dossier is nog niet compleet voor professionele verwerking.");
  if (input.reviewStatus === "READY_FOR_REVIEW") reasons.push("Professionele review staat open.");
  if (input.reviewStatus === "REVIEWED") reasons.push("Professionele goedkeuring staat open.");
  if (input.proposedIncomeFacts > 0) { score -= Math.min(20, input.proposedIncomeFacts * 4); reasons.push(`${input.proposedIncomeFacts} inkomensfeit(en) wachten op goedkeuring.`); }
  if (input.documentsAwaitingReview > 0) { score -= Math.min(15, input.documentsAwaitingReview * 3); reasons.push(`${input.documentsAwaitingReview} document(en) wachten op review.`); }
  if (input.documentAnalysisErrors > 0) { score -= Math.min(25, input.documentAnalysisErrors * 10); reasons.push(`${input.documentAnalysisErrors} documentanalyse(s) bevatten een fout.`); }
  if (input.calculationCount === 0) { score -= 25; reasons.push("Er is nog geen berekeningssnapshot."); }
  if (input.calculationStale) { score -= 15; reasons.push("De invoer is gewijzigd na de laatste berekening."); }
  if (input.largeCalculationChange) { score -= 10; reasons.push("De laatste uitkomst wijkt sterk af van de vorige berekening."); }
  if ((input.overdueTasks ?? 0) > 0) { score -= Math.min(40, (input.overdueTasks ?? 0) * 25); reasons.push(`${input.overdueTasks} open taak/taken zijn verlopen.`); }
  if ((input.todayTasks ?? 0) > 0) { score -= Math.min(10, (input.todayTasks ?? 0) * 5); reasons.push(`${input.todayTasks} open taak/taken staan voor vandaag gepland.`); }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const priority = score < 40 ? "URGENT" : score < 60 ? "HIGH" : score < 80 ? "NORMAL" : "LOW";
  return { score, priority, reasons };
}
