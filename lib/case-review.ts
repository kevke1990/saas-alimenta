import { detectLegalExceptions } from "./legal-exceptions";

export type ReviewSeverity = "CRITICAL" | "WARNING" | "INFO" | "OK";
export type ReviewItem = {
  key: string;
  severity: ReviewSeverity;
  title: string;
  detail: string;
  action?: string;
  href?: string;
  source?: string;
};

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const hasValue = (v: unknown) => typeof v === "string" ? v.trim().length > 0 : num(v) > 0;
const wizard = (hash: string) => `/cases/current/edit/wizard#${hash}`;

export function reviewCase(input: { data: any; documents?: any[]; calculations?: any[]; result?: any }) {
  const d = input.data || {};
  const parents = Array.isArray(d.parents) ? d.parents : [];
  const children = Array.isArray(d.children) ? d.children : [];
  const docs = input.documents || [];
  const calculations = input.calculations || [];
  const result = input.result || {};
  const items: ReviewItem[] = [];
  const add = (key: string, severity: ReviewSeverity, title: string, detail: string, action?: string, href?: string, source?: string) => items.push({ key, severity, title, detail, action, href, source });

  if (parents.length !== 2) add("parents.count", "CRITICAL", "Twee ouders vereist", "Het dossier bevat niet precies twee ouders.", "Controleer de oudergegevens.", wizard("parents"));
  else add("parents.count", "OK", "Ouderstructuur compleet", "Precies twee ouders zijn vastgelegd.");
  if (!children.length) add("children.missing", "CRITICAL", "Kinderen ontbreken", "Er is geen kind aan het dossier gekoppeld.", "Voeg de kinderen toe.", wizard("children"));
  else add("children.present", "OK", "Kinderen vastgelegd", `${children.length} kind(eren) zijn vastgelegd.`);

  parents.forEach((p: any, i: number) => {
    const name = p.name || `Ouder ${i + 1}`;
    const income = p.income || {};
    const parentHash = `parent-${i}`;
    if (!hasValue(p.name)) add(`parent.${i}.name`, "WARNING", `${name}: naam ontbreekt`, "De ouder heeft geen herkenbare naam.", "Vul de naam aan.", wizard(parentHash));
    if (!hasValue(p.nbi) && !hasValue(income.salaryMonthly) && !hasValue(income.netIncomeMonthly)) add(`parent.${i}.income`, "CRITICAL", `${name}: inkomensbasis ontbreekt`, "Er is geen NBI, bruto salaris of netto inkomen ingevuld.", "Vul inkomen aan of verifieer inkomensdocumenten.", wizard(parentHash));
    if (!hasValue(p.careDaysPerWeek)) add(`parent.${i}.care`, "WARNING", `${name}: zorgverdeling ontbreekt`, "Zorgdagen per week ontbreken en kunnen de zorgkorting beïnvloeden.", "Controleer de zorgverdeling.", wizard(parentHash));
    if (!p.housing || !hasValue(p.housing.monthlyCosts ?? p.housingCosts)) add(`parent.${i}.housing`, "WARNING", `${name}: woonlast ontbreekt`, "De woonlast is niet ingevuld.", "Controleer de woonlast en onderbouwing.", wizard(`housing-${i}`));
    if (p.newPartner?.present && !hasValue(p.newPartner.nbiMonthly)) add(`parent.${i}.partnerIncome`, "WARNING", `${name}: inkomen nieuwe partner ontbreekt`, "Er is een nieuwe partner gemarkeerd maar geen partnerinkomen vastgelegd.", "Controleer het inkomen van de nieuwe partner.", wizard(`partner-${i}`));
  });

  children.forEach((child: any, i: number) => {
    const name = child.name || `Kind ${i + 1}`;
    if (num(child.age) <= 0) add(`child.${i}.age`, "CRITICAL", `${name}: leeftijd ontbreekt`, "De leeftijd is nodig voor de behoefte- en jongmeerderjarigencontrole.", "Vul de leeftijd in.", wizard(`child-${i}`));
    if (!child.residence) add(`child.${i}.residence`, "WARNING", `${name}: hoofdverblijf ontbreekt`, "De verblijfssituatie ontbreekt en kan de zorgverdeling beïnvloeden.", "Controleer het hoofdverblijf.", wizard(`child-${i}`));
    if (num(child.age) >= 18 && num(child.age) <= 21 && (!child.studentType || child.livesAtHome === undefined || child.ownIncome === undefined)) add(`child.${i}.youngadult`, "WARNING", `${name}: jongmeerderjarige controleren`, "Opleiding, woonvorm, beurs of eigen inkomsten zijn niet volledig zichtbaar.", "Controleer opleiding, woonvorm, beurs en eigen inkomsten.", wizard(`child-${i}`));
  });

  const docsAnalyzed = docs.filter((x: any) => x.aiStatus === "COMPLETED").length;
  const docsApproved = docs.filter((x: any) => !!x.approvedAt).length;
  if (docs.length && docsAnalyzed < docs.length) add("documents.open", "WARNING", "Niet alle documenten geanalyseerd", `${docsAnalyzed} van ${docs.length} documenten zijn geanalyseerd.`, "Analyseer de openstaande documenten.", "/cases/current/income-facts");
  if (docsAnalyzed && docsApproved < docsAnalyzed) add("documents.approval", "WARNING", "AI-resultaten niet volledig geaccordeerd", `${docsApproved} van ${docsAnalyzed} geanalyseerde documenten zijn geaccordeerd.`, "Controleer en accordeer voorgestelde feiten.", "/cases/current/income-facts");

  const historical = num(d.historicalNBGI ?? d.histNBGI ?? d.historicalNbgi);
  if (children.some((c: any) => num(c.age) < 18) && historical <= 0) add("history.nbgi", "WARNING", "Historisch gezinsinkomen ontbreekt", "De kinderalimentatie kan zonder relevant historisch NBGI een benadering gebruiken.", "Controleer het inkomen ten tijde van de relevante periode.", wizard("history"));
  else if (historical > 0) add("history.nbgi", "OK", "Historisch NBGI aanwezig", `Historisch NBGI: € ${Math.round(historical).toLocaleString("nl-NL")}.`);

  const specialCosts = children.reduce((s: number, c: any) => s + num(c.specialCosts), 0);
  if (specialCosts > 0) add("children.specialCosts", "INFO", "Bijzondere kosten aanwezig", `Er is € ${Math.round(specialCosts).toLocaleString("nl-NL")} aan bijzondere kindkosten ingevoerd.`, "Controleer kwalificatie en bewijs van deze kosten.", wizard("children"));
  const otherMaintenance = parents.reduce((s: number, p: any) => s + num(p.otherMaintenance), 0);
  if (otherMaintenance > 0) add("maintenance.other", "WARNING", "Andere onderhoudsverplichtingen", `Er is € ${Math.round(otherMaintenance).toLocaleString("nl-NL")} aan andere onderhoudsverplichtingen ingevoerd.`, "Controleer rangorde, bewijs en toerekening.", wizard("parents"));
  if (parents.some((p: any) => num(p.housingCosts) > 0)) {
    const mismatches = parents.filter((p: any) => num(p.housingCosts) > Math.max(0, num(p.nbi) * 0.30)).length;
    if (mismatches) add("housing.review", "INFO", "Woonlast boven forfait", "Bij één of meer ouders ligt de ingevoerde woonlast boven het rekenkundige woonbudget.", "Controleer werkelijke woonlast en onderbouwing.", wizard("housing"));
  }

  if (d.partnerSupport?.enabled) {
    const ps = d.partnerSupport;
    if (!hasValue(ps.historicalNBGI ?? d.historicalNBGI)) add("pal.history", "WARNING", "PAL: historisch NBGI ontbreekt", "Partneralimentatie is actief maar de historische inkomensbasis ontbreekt.", "Controleer historische behoefte.", wizard("partner-support"));
    if (!hasValue(ps.recipientVerdiencapaciteit) && !hasValue(ps.concreteNeedNet)) add("pal.need", "WARNING", "PAL: behoefte/verdiencapaciteit controleren", "Er is geen expliciete behoefte of verdiencapaciteit vastgelegd.", "Controleer behoefte en verdiencapaciteit.", wizard("partner-support"));
  }

  for (const exception of detectLegalExceptions(d)) add(`legal.${exception.key}`, exception.severity, exception.title, exception.detail, exception.action, wizard("legal"), "LEGAL_EXCEPTION_SIGNAL");
  if (calculations.length === 0) add("calculation.missing", "WARNING", "Nog geen berekening", "Er is nog geen berekeningssnapshot opgeslagen.", "Maak eerst een berekening.", wizard("calculation"));
  else add("calculation.present", "OK", "Berekening opgeslagen", `${calculations.length} berekeningssnapshot(s) zijn beschikbaar.`);
  const warningsFromResult = Array.isArray(result.warnings) ? result.warnings.length : 0;
  if (warningsFromResult) add("calculation.warnings", "WARNING", "Berekeningswaarschuwingen", `${warningsFromResult} waarschuwing(en) staan in het laatste rekenresultaat.`, "Open het resultaat en beoordeel iedere waarschuwing.", "/cases/current");

  const critical = items.filter(x => x.severity === "CRITICAL").length;
  const warnings = items.filter(x => x.severity === "WARNING").length;
  const infos = items.filter(x => x.severity === "INFO").length;
  const score = Math.max(0, Math.min(100, 100 - critical * 25 - warnings * 10 - infos * 2));
  return { version: "0.11.1", score, readyForProfessionalReview: critical === 0, criticalCount: critical, warningCount: warnings, infoCount: infos, items, disclaimer: "Case Review is een signaleringslaag. Het systeem neemt geen juridisch besluit en vervangt de professionele beoordeling niet." };
}
