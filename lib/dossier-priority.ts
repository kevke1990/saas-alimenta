export type DossierPriorityInput = {
  reviewStatus: string;
  hasCalculation: boolean;
  calculationNormVersion?: string | null;
  activeNormVersion?: string | null;
  proposedIncomeFacts: number;
  documentsAwaitingReview: number;
  overdueTasks: number;
  todayTasks: number;
};

export type DossierPrioritySignal = { key: string; label: string; points: number };
export type DossierPriority = { score: number; level: "HIGH" | "MEDIUM" | "LOW"; signals: DossierPrioritySignal[] };

export function calculateDossierPriority(input: DossierPriorityInput): DossierPriority {
  const signals: DossierPrioritySignal[] = [];
  if (input.overdueTasks > 0) signals.push({ key: "OVERDUE_TASK", label: `${input.overdueTasks} achterstallige taak${input.overdueTasks === 1 ? "" : "ken"}`, points: 35 });
  if (input.todayTasks > 0) signals.push({ key: "TODAY_TASK", label: `${input.todayTasks} taak${input.todayTasks === 1 ? "" : "ken"} voor vandaag`, points: 10 });
  if (input.reviewStatus === "INCOMPLETE") signals.push({ key: "INCOMPLETE_REVIEW", label: "Professionele review nog niet gereed", points: 25 });
  else if (input.reviewStatus === "READY_FOR_REVIEW") signals.push({ key: "READY_FOR_REVIEW", label: "Wacht op professionele review", points: 30 });
  else if (input.reviewStatus === "REVIEWED") signals.push({ key: "AWAITING_APPROVAL", label: "Review uitgevoerd, goedkeuring ontbreekt", points: 20 });
  if (input.proposedIncomeFacts > 0) signals.push({ key: "INCOME_FACTS", label: `${input.proposedIncomeFacts} inkomensfeit${input.proposedIncomeFacts === 1 ? "" : "en"} wacht op beoordeling`, points: 25 });
  if (input.documentsAwaitingReview > 0) signals.push({ key: "DOCUMENT_REVIEW", label: `${input.documentsAwaitingReview} document${input.documentsAwaitingReview === 1 ? "" : "en"} wacht op AI-/documentreview`, points: 15 });
  if (!input.hasCalculation) signals.push({ key: "NO_CALCULATION", label: "Nog geen berekening beschikbaar", points: 20 });
  else if (input.activeNormVersion && input.calculationNormVersion && input.calculationNormVersion !== input.activeNormVersion) signals.push({ key: "STALE_NORM", label: "Berekening gebruikt een andere normversie dan actief", points: 20 });
  const score = Math.min(100, signals.reduce((total, signal) => total + signal.points, 0));
  return { score, level: score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW", signals: signals.sort((a, b) => b.points - a.points) };
}
