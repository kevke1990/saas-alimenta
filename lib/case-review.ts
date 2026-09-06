export type ReviewSeverity = "CRITICAL" | "WARNING" | "INFO" | "OK";
export type ReviewItem = {
  key: string;
  severity: ReviewSeverity;
  title: string;
  detail: string;
  action?: string;
  source?: string;
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const hasValue = (v: unknown) => typeof v === "string" ? v.trim().length > 0 : num(v) > 0;

/**
 * Deterministic professional case review. This is deliberately not a legal
 * decision maker and does not invent missing facts. It identifies review
 * signals before a professional relies on a calculation.
 */
export function reviewCase(input: { data: any; documents?: any[]; calculations?: any[]; result?: any }) {
  const d = input.data || {};
  const parents = Array.isArray(d.parents) ? d.parents : [];
  const children = Array.isArray(d.children) ? d.children : [];
  const docs = input.documents || [];
  const calculations = input.calculations || [];
  const result = input.result || {};
  const items: ReviewItem[] = [];

  const add = (key: string, severity: ReviewSeverity, title: string, detail: string, action?: string, source?: string) =>
    items.push({ key, severity, title, detail, action, source });

  if (parents.length !== 2) {
    add("parents.count", "CRITICAL", "Twee ouders vereist", "Het dossier bevat niet precies twee ouders.", "Controleer de oudergegevens.");
  } else {
    add("parents.count", "OK", "Ouderstructuur compleet", "Precies twee ouders zijn vastgelegd.");
  }

  if (!children.length) add("children.missing", "CRITICAL", "Kinderen ontbreken", "Er is geen kind aan het dossier gekoppeld.", "Voeg de kinderen toe.");
  else add("children.present", "OK", "Kinderen vastgelegd", `${children.length} kind(eren) zijn vastgelegd.`);

  const incomeMissing = parents.filter((p: any) => !hasValue(p.nbi) && !p.income).length;
  if (incomeMissing) add("income.missing", "CRITICAL", "Inkomensbasis ontbreekt", `Voor ${incomeMissing} ouder(s) ontbreekt een NBI of inkomensprofiel.`, "Vul het inkomen aan of laat documenten analyseren.");
  else add("income.present", "OK", "Inkomensbasis aanwezig", "Voor beide ouders is een inkomensbasis aanwezig.");

  const docsAnalyzed = docs.filter((x: any) => x.aiStatus === "COMPLETED").length;
  const docsApproved = docs.filter((x: any) => !!x.approvedAt).length;
  if (docs.length && docsAnalyzed < docs.length) add("documents.open", "WARNING", "Niet alle documenten geanalyseerd", `${docsAnalyzed} van ${docs.length} documenten zijn geanalyseerd.`, "Analyseer de openstaande documenten.");
  if (docsAnalyzed && docsApproved < docsAnalyzed) add("documents.approval", "WARNING", "AI-resultaten niet volledig geaccordeerd", `${docsApproved} van ${docsAnalyzed} geanalyseerde documenten zijn geaccordeerd.`, "Controleer en accordeer voorgestelde feiten.");

  const historical = num(d.historicalNBGI ?? d.histNBGI ?? d.historicalNbgi);
  if (children.some((c: any) => num(c.age) < 18) && historical <= 0) {
    add("history.nbgi", "WARNING", "Historisch gezinsinkomen ontbreekt", "De kinderalimentatie kan zonder relevant historisch NBGI een benadering gebruiken.", "Controleer het inkomen ten tijde van de relevante periode.");
  } else if (historical > 0) {
    add("history.nbgi", "OK", "Historisch NBGI aanwezig", `Historisch NBGI: € ${Math.round(historical).toLocaleString("nl-NL")}.`);
  }

  const youngAdults = children.filter((c: any) => num(c.age) >= 18 && num(c.age) <= 21);
  if (youngAdults.length && youngAdults.some((c: any) => !c.studentType && !hasValue(c.ownIncome))) {
    add("youngadult.review", "WARNING", "Jongmeerderjarige controleren", "Voor één of meer jongmeerderjarigen ontbreken gegevens die relevant kunnen zijn voor de WSF-benadering.", "Controleer opleiding, woonvorm, beurs en eigen inkomsten.");
  }

  const specialCosts = children.reduce((s: number, c: any) => s + num(c.specialCosts), 0);
  if (specialCosts > 0) add("children.specialCosts", "INFO", "Bijzondere kosten aanwezig", `Er is € ${Math.round(specialCosts).toLocaleString("nl-NL")} aan bijzondere kindkosten ingevoerd.`, "Controleer kwalificatie en bewijs van deze kosten.");

  const otherMaintenance = parents.reduce((s: number, p: any) => s + num(p.otherMaintenance), 0);
  if (otherMaintenance > 0) add("maintenance.other", "WARNING", "Andere onderhoudsverplichtingen", `Er is € ${Math.round(otherMaintenance).toLocaleString("nl-NL")} aan andere onderhoudsverplichtingen ingevoerd.`, "Controleer rangorde, bewijs en toerekening.");

  if (parents.some((p: any) => num(p.housingCosts) > 0)) {
    const mismatches = parents.filter((p: any) => num(p.housingCosts) > Math.max(0, num(p.nbi) * 0.30)).length;
    if (mismatches) add("housing.review", "INFO", "Woonlast boven forfait", "Bij één of meer ouders ligt de ingevoerde woonlast boven het rekenkundige woonbudget. Dat kan een maatwerkcontrole rechtvaardigen.", "Controleer werkelijke woonlast en onderbouwing.");
  }

  if (calculations.length === 0) add("calculation.missing", "WARNING", "Nog geen berekening", "Er is nog geen berekeningssnapshot opgeslagen.", "Maak eerst een berekening nadat de dossiercontrole is afgerond.");
  else add("calculation.present", "OK", "Berekening opgeslagen", `${calculations.length} berekeningssnapshot(s) zijn beschikbaar.`);

  const warningsFromResult = Array.isArray(result.warnings) ? result.warnings.length : 0;
  if (warningsFromResult) add("calculation.warnings", "WARNING", "Berekeningswaarschuwingen", `${warningsFromResult} waarschuwing(en) staan in het laatste rekenresultaat.`, "Open het resultaat en beoordeel iedere waarschuwing.");

  const critical = items.filter(x => x.severity === "CRITICAL").length;
  const warnings = items.filter(x => x.severity === "WARNING").length;
  const infos = items.filter(x => x.severity === "INFO").length;
  const score = Math.max(0, Math.min(100, 100 - critical * 25 - warnings * 10 - infos * 2));

  return {
    version: "0.9.10",
    score,
    readyForProfessionalReview: critical === 0,
    criticalCount: critical,
    warningCount: warnings,
    infoCount: infos,
    items,
    disclaimer: "Case Review is een signaleringslaag. Het systeem neemt geen juridisch besluit en vervangt de professionele beoordeling niet.",
  };
}
