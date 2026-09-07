export type IntelligenceSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type IntelligenceSignal = {
  key: string;
  title: string;
  explanation: string;
  evidence: string[];
  action: string;
  severity: IntelligenceSeverity;
  confidence: number;
  category: "DATA_QUALITY" | "REVIEW" | "CALCULATION" | "DOCUMENTS" | "CONSISTENCY";
};

export type IntelligenceInput = {
  reviewStatus: string;
  calculationCount: number;
  latestNormVersion?: string | null;
  activeNormVersion?: string | null;
  proposedIncomeFacts: number;
  lowConfidenceIncomeFacts: number;
  documentsAwaitingReview: number;
  documentAnalysisErrors: number;
  missingEvidenceFields: string[];
  latestTotalMonthly?: number | null;
  previousTotalMonthly?: number | null;
  latestCalculationAt?: Date | null;
  updatedAt?: Date | null;
};

const money = (n: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function buildExplainableIntelligence(input: IntelligenceInput): IntelligenceSignal[] {
  const signals: IntelligenceSignal[] = [];
  if (input.missingEvidenceFields.length) signals.push({
    key: "MISSING_EVIDENCE", title: "Ontbrekende onderbouwing", category: "DATA_QUALITY", severity: "HIGH", confidence: 0.96,
    explanation: "Essentiële invoer heeft nog geen duidelijke onderbouwing of bronverwijzing.",
    evidence: input.missingEvidenceFields.slice(0, 6), action: "Controleer de bron en leg de ontbrekende onderbouwing vast voordat je de berekening definitief maakt.",
  });
  if (input.lowConfidenceIncomeFacts > 0) signals.push({
    key: "LOW_CONFIDENCE_INCOME", title: "Inkomensfeiten met lage zekerheid", category: "DATA_QUALITY", severity: "HIGH", confidence: 0.93,
    explanation: "Een of meer geëxtraheerde inkomensfeiten hebben een lage betrouwbaarheidsscore.",
    evidence: [`${input.lowConfidenceIncomeFacts} inkomensfeit(en) met lage confidence`], action: "Vergelijk de voorgestelde feiten met het brondocument en keur ze handmatig goed of corrigeer ze.",
  });
  if (input.proposedIncomeFacts > 0) signals.push({
    key: "PROPOSED_INCOME", title: "Voorgestelde inkomensfeiten", category: "DOCUMENTS", severity: "MEDIUM", confidence: 0.99,
    explanation: "Er zijn feiten voorgesteld vanuit documentverwerking die nog niet als definitieve feiten zijn goedgekeurd.",
    evidence: [`${input.proposedIncomeFacts} voorgesteld inkomensfeit/incomensfeiten`], action: "Beoordeel de feiten voordat je een definitieve berekening of rapportage gebruikt.",
  });
  if (input.documentsAwaitingReview > 0) signals.push({
    key: "DOCUMENTS_AWAITING_REVIEW", title: "Documenten wachten op review", category: "DOCUMENTS", severity: "MEDIUM", confidence: 0.99,
    explanation: "Geanalyseerde documenten zijn nog niet professioneel afgerond.", evidence: [`${input.documentsAwaitingReview} document(en) wachten op review`], action: "Open de documentreview en controleer de relevante extracties.",
  });
  if (input.documentAnalysisErrors > 0) signals.push({
    key: "DOCUMENT_ANALYSIS_ERROR", title: "Documentanalyse bevat fouten", category: "DOCUMENTS", severity: "HIGH", confidence: 0.99,
    explanation: "Een documentanalyse is mislukt of heeft een foutstatus.", evidence: [`${input.documentAnalysisErrors} documentanalyse(s) met foutstatus`], action: "Controleer het document opnieuw of voer de verwerking opnieuw uit; gebruik de extractie niet blind.",
  });
  if (input.reviewStatus === "READY_FOR_REVIEW") signals.push({ key: "REVIEW_REQUIRED", title: "Professionele review nodig", category: "REVIEW", severity: "HIGH", confidence: 0.99, explanation: "Het dossier is gemarkeerd als klaar voor professionele review.", evidence: ["reviewStatus = READY_FOR_REVIEW"], action: "Voer de inhoudelijke review uit en leg bevindingen vast." });
  if (input.reviewStatus === "REVIEWED") signals.push({ key: "APPROVAL_REQUIRED", title: "Goedkeuring nog nodig", category: "REVIEW", severity: "HIGH", confidence: 0.99, explanation: "De review is uitgevoerd, maar het dossier is nog niet professioneel goedgekeurd.", evidence: ["reviewStatus = REVIEWED"], action: "Controleer de review en leg goedkeuring vast als het dossier voldoet." });
  if (input.calculationCount === 0) signals.push({ key: "NO_CALCULATION", title: "Geen berekening beschikbaar", category: "CALCULATION", severity: "HIGH", confidence: 0.99, explanation: "Er is nog geen berekeningssnapshot beschikbaar voor dit dossier.", evidence: ["calculationCount = 0"], action: "Controleer eerst de invoer en voer de berekening uit." });
  if (input.activeNormVersion && input.latestNormVersion && input.activeNormVersion !== input.latestNormVersion) signals.push({ key: "STALE_NORM", title: "Berekening gebruikt oudere normversie", category: "CALCULATION", severity: "HIGH", confidence: 0.99, explanation: "De laatste berekening gebruikt niet de momenteel actieve normversie.", evidence: [`Berekening: ${input.latestNormVersion}`, `Actief: ${input.activeNormVersion}`], action: "Controleer of herberekening met de actieve norm nodig is." });
  if (input.latestTotalMonthly != null && input.previousTotalMonthly != null && input.previousTotalMonthly > 0) {
    const delta = Math.abs(input.latestTotalMonthly - input.previousTotalMonthly) / input.previousTotalMonthly;
    if (delta >= 0.2) signals.push({ key: "CALCULATION_CHANGE", title: "Grote wijziging in uitkomst", category: "CONSISTENCY", severity: "MEDIUM", confidence: 0.88, explanation: "De totale maandelijkse uitkomst wijkt sterk af van de vorige berekening. Dit is een controlehint, geen foutmelding.", evidence: [`Vorige: ${money(input.previousTotalMonthly)}`, `Nieuwe: ${money(input.latestTotalMonthly)}`, `Afwijking: ${Math.round(delta * 100)}%`], action: "Vergelijk de gewijzigde invoer en controleer de oorzaak van de uitkomstwijziging." });
  }
  if (input.latestCalculationAt && input.updatedAt && input.latestCalculationAt < input.updatedAt && input.calculationCount > 0) signals.push({ key: "CALCULATION_MAY_BE_STALE", title: "Invoer gewijzigd na laatste berekening", category: "CONSISTENCY", severity: "MEDIUM", confidence: 0.97, explanation: "Het dossier is bijgewerkt nadat de laatste berekening is opgeslagen.", evidence: ["updatedAt is later dan latestCalculationAt"], action: "Controleer of de gewijzigde invoer de berekening raakt en herbereken indien nodig." });
  return signals.sort((a, b) => ({ CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }[a.severity] - { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 }[b.severity] || b.confidence - a.confidence));
}
