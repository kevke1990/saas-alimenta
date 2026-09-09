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

const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const hasValue = (value: unknown) =>
  typeof value === "string" ? value.trim().length > 0 : num(value) > 0;

const wizard = (hash: string) => `/cases/current/edit/wizard#${hash}`;

export function reviewCase(input: {
  data: any;
  documents?: any[];
  calculations?: any[];
  result?: any;
}) {
  const data = input.data || {};
  const parents = Array.isArray(data.parents) ? data.parents : [];
  const children = Array.isArray(data.children) ? data.children : [];
  const documents = input.documents || [];
  const calculations = input.calculations || [];
  const result = input.result || {};
  const items: ReviewItem[] = [];

  const add = (
    key: string,
    severity: ReviewSeverity,
    title: string,
    detail: string,
    action?: string,
    href?: string,
    source?: string,
  ) => items.push({ key, severity, title, detail, action, href, source });

  if (parents.length !== 2) {
    add(
      "parents.count",
      "CRITICAL",
      "Twee ouders vereist",
      "Het dossier bevat niet precies twee ouders.",
      "Controleer de oudergegevens.",
      wizard("parents"),
    );
  } else {
    add("parents.count", "OK", "Ouderstructuur compleet", "Precies twee ouders zijn vastgelegd.");
  }

  if (!children.length) {
    add(
      "children.missing",
      "CRITICAL",
      "Kinderen ontbreken",
      "Er is geen kind aan het dossier gekoppeld.",
      "Voeg de kinderen toe.",
      wizard("children"),
    );
  } else {
    add("children.present", "OK", "Kinderen vastgelegd", `${children.length} kind(eren) zijn vastgelegd.`);
  }

  parents.forEach((parent: any, index: number) => {
    const name = parent.name || `Ouder ${index + 1}`;
    const income = parent.income || {};
    const hash = `parent-${index}`;

    if (!hasValue(parent.name)) {
      add(
        `parent.${index}.name`,
        "WARNING",
        `${name}: naam ontbreekt`,
        "De ouder heeft geen herkenbare naam.",
        "Vul de naam aan.",
        wizard(hash),
      );
    }

    if (!hasValue(parent.nbi) && !hasValue(income.salaryMonthly) && !hasValue(income.netIncomeMonthly)) {
      add(
        `parent.${index}.income`,
        "CRITICAL",
        `${name}: inkomensbasis ontbreekt`,
        "Er is geen NBI, bruto salaris of netto inkomen ingevuld.",
        "Vul inkomen aan of verifieer inkomensdocumenten.",
        wizard(hash),
      );
    }

    if (!hasValue(parent.careDaysPerWeek)) {
      add(
        `parent.${index}.care`,
        "WARNING",
        `${name}: zorgverdeling ontbreekt`,
        "Zorgdagen per week ontbreken en kunnen de zorgkorting beïnvloeden.",
        "Controleer de zorgverdeling.",
        wizard(hash),
      );
    }

    if (!parent.housing || !hasValue(parent.housing.monthlyCosts ?? parent.housingCosts)) {
      add(
        `parent.${index}.housing`,
        "WARNING",
        `${name}: woonlast ontbreekt`,
        "De woonlast is niet ingevuld.",
        "Controleer de woonlast en onderbouwing.",
        wizard(`housing-${index}`),
      );
    }

    if (parent.newPartner?.present && !hasValue(parent.newPartner.nbiMonthly)) {
      add(
        `parent.${index}.partnerIncome`,
        "WARNING",
        `${name}: inkomen nieuwe partner ontbreekt`,
        "Er is een nieuwe partner gemarkeerd maar geen partnerinkomen vastgelegd.",
        "Controleer het inkomen van de nieuwe partner.",
        wizard(`partner-${index}`),
      );
    }
  });

  children.forEach((child: any, index: number) => {
    const name = child.name || `Kind ${index + 1}`;
    const age = num(child.age);

    if (age <= 0) {
      add(
        `child.${index}.age`,
        "CRITICAL",
        `${name}: leeftijd ontbreekt`,
        "De leeftijd is nodig voor de behoefte- en jongmeerderjarigencontrole.",
        "Vul de leeftijd in.",
        wizard(`child-${index}`),
      );
    }

    if (!child.residence) {
      add(
        `child.${index}.residence`,
        "WARNING",
        `${name}: hoofdverblijf ontbreekt`,
        "De verblijfssituatie ontbreekt en kan de zorgverdeling beïnvloeden.",
        "Controleer het hoofdverblijf.",
        wizard(`child-${index}`),
      );
    }

    if (age >= 18 && age <= 21) {
      add(
        "youngadult.review",
        "WARNING",
        `${name}: jongmeerderjarige controleren`,
        "Controleer opleiding, woonvorm, beurs en eigen inkomsten voor deze jongmeerderjarige.",
        "Controleer opleiding, woonvorm, beurs en eigen inkomsten.",
        wizard(`child-${index}`),
      );
    }
  });

  const documentsAnalyzed = documents.filter((document: any) => document.aiStatus === "COMPLETED").length;
  const documentsApproved = documents.filter((document: any) => !!document.approvedAt).length;

  if (documents.length && documentsAnalyzed < documents.length) {
    add(
      "documents.open",
      "WARNING",
      "Niet alle documenten geanalyseerd",
      `${documentsAnalyzed} van ${documents.length} documenten zijn geanalyseerd.`,
      "Analyseer de openstaande documenten.",
      "/cases/current/income-facts",
    );
  }

  if (documentsAnalyzed && documentsApproved < documentsAnalyzed) {
    add(
      "documents.approval",
      "WARNING",
      "AI-resultaten niet volledig geaccordeerd",
      `${documentsApproved} van ${documentsAnalyzed} geanalyseerde documenten zijn geaccordeerd.`,
      "Controleer en accordeer voorgestelde feiten.",
      "/cases/current/income-facts",
    );
  }

  const historicalNBGI = num(data.historicalNBGI ?? data.histNBGI ?? data.historicalNbgi);
  if (children.some((child: any) => num(child.age) < 18) && historicalNBGI <= 0) {
    add(
      "history.nbgi",
      "WARNING",
      "Historisch gezinsinkomen ontbreekt",
      "De kinderalimentatie kan zonder relevant historisch NBGI een benadering gebruiken.",
      "Controleer het inkomen ten tijde van de relevante periode.",
      wizard("history"),
    );
  } else if (historicalNBGI > 0) {
    add(
      "history.nbgi",
      "OK",
      "Historisch NBGI aanwezig",
      `Historisch NBGI: € ${Math.round(historicalNBGI).toLocaleString("nl-NL")}.`,
    );
  }

  const specialCosts = children.reduce((sum: number, child: any) => sum + num(child.specialCosts), 0);
  if (specialCosts > 0) {
    add(
      "children.specialCosts",
      "INFO",
      "Bijzondere kosten aanwezig",
      `Er is € ${Math.round(specialCosts).toLocaleString("nl-NL")} aan bijzondere kindkosten ingevoerd.`,
      "Controleer kwalificatie en bewijs van deze kosten.",
      wizard("children"),
    );
  }

  const otherMaintenance = parents.reduce((sum: number, parent: any) => sum + num(parent.otherMaintenance), 0);
  if (otherMaintenance > 0) {
    add(
      "maintenance.other",
      "WARNING",
      "Andere onderhoudsverplichtingen",
      `Er is € ${Math.round(otherMaintenance).toLocaleString("nl-NL")} aan andere onderhoudsverplichtingen ingevoerd.`,
      "Controleer rangorde, bewijs en toerekening.",
      wizard("parents"),
    );
  }

  if (data.partnerSupport?.enabled) {
    const partnerSupport = data.partnerSupport;
    if (!hasValue(partnerSupport.historicalNBGI ?? data.historicalNBGI)) {
      add(
        "pal.history",
        "WARNING",
        "PAL: historisch NBGI ontbreekt",
        "Partneralimentatie is actief maar de historische inkomensbasis ontbreekt.",
        "Controleer historische behoefte.",
        wizard("partner-support"),
      );
    }

    if (!hasValue(partnerSupport.recipientVerdiencapaciteit) && !hasValue(partnerSupport.concreteNeedNet)) {
      add(
        "pal.need",
        "WARNING",
        "PAL: behoefte/verdiencapaciteit controleren",
        "Er is geen expliciete behoefte of verdiencapaciteit vastgelegd.",
        "Controleer behoefte en verdiencapaciteit.",
        wizard("partner-support"),
      );
    }
  }

  for (const exception of detectLegalExceptions(data)) {
    add(
      `legal.${exception.key}`,
      exception.severity,
      exception.title,
      exception.detail,
      exception.action,
      wizard("legal"),
      "LEGAL_EXCEPTION_SIGNAL",
    );
  }

  if (calculations.length === 0) {
    add(
      "calculation.missing",
      "WARNING",
      "Nog geen berekening",
      "Er is nog geen berekeningssnapshot opgeslagen.",
      "Maak eerst een berekening.",
      wizard("calculation"),
    );
  } else {
    add(
      "calculation.present",
      "OK",
      "Berekening opgeslagen",
      `${calculations.length} berekeningssnapshot(s) zijn beschikbaar.`,
    );
  }

  const resultWarnings = Array.isArray(result.warnings) ? result.warnings.length : 0;
  if (resultWarnings) {
    add(
      "calculation.warnings",
      "WARNING",
      "Berekeningswaarschuwingen",
      `${resultWarnings} waarschuwing(en) staan in het laatste rekenresultaat.`,
      "Open het resultaat en beoordeel iedere waarschuwing.",
      "/cases/current",
    );
  }

  const critical = items.filter((item) => item.severity === "CRITICAL").length;
  const warnings = items.filter((item) => item.severity === "WARNING").length;
  const infos = items.filter((item) => item.severity === "INFO").length;

  return {
    version: "0.11.3",
    score: Math.max(0, Math.min(100, 100 - critical * 25 - warnings * 10 - infos * 2)),
    readyForProfessionalReview: critical === 0,
    criticalCount: critical,
    warningCount: warnings,
    infoCount: infos,
    items,
    disclaimer: "Case Review is een signaleringslaag. Het systeem neemt geen juridisch besluit en vervangt de professionele beoordeling niet.",
  };
}
