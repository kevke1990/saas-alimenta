export type AnonymizedCalculationExport = {
  title: string;
  notice: string;
  disclaimer: string;
  generatedAt: string;
  normVersion?: string;
  engineVersion?: string;
  reviewStatus?: string;
  approvalStatus?: string;
  input: unknown;
  calculation: unknown;
  warnings: ExportWarning[];
  overrides: unknown[];
};

export type ExportWarning = {
  field: string;
  currentValue: unknown;
  reason: string;
  possibleImpact: string;
};

const DIRECT_IDENTIFIER_KEYS = /(^|_)(id|uuid|ip|email|phone|telephone|mobile|address|street|postcode|postal|hostname|url|token|secret|password|session)(_|$)|(?:id|uuid|ipaddress|email|phone|telephone|mobile|address|street|postcode|postal|hostname|url|token|secret|password|session)$/i;
const PARENT_KEYS = /parent|ouder/i;
const CHILD_KEYS = /child|kind/i;
const PARTNER_KEYS = /partner/i;

function labelForKey(key: string, counters: { parent: number; child: number; partner: number }) {
  if (PARENT_KEYS.test(key)) {
    counters.parent += 1;
    return counters.parent === 1 ? "Ouder A" : "Ouder B";
  }
  if (CHILD_KEYS.test(key)) {
    counters.child += 1;
    return `Kind ${counters.child}`;
  }
  if (PARTNER_KEYS.test(key)) {
    counters.partner += 1;
    return counters.partner === 1 ? "Partner A" : "Partner B";
  }
  return "Geanonimiseerd";
}

function scrubText(value: string) {
  return value
    .replace(/\b[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+\s+[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+\b/g, "Geanonimiseerde naam")
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[verwijderd e-mailadres]")
    .replace(/\b(?:https?:\/\/|www\.)\S+\b/gi, "[verwijderde URL]")
    .replace(/\b(?:\+?31|0)\s?[1-9](?:[\s.-]?\d){8}\b/g, "[verwijderd telefoonnummer]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[verwijderd IP-adres]");
}

function anonymizeValue(value: unknown, key: string, counters: { parent: number; child: number; partner: number }): unknown {
  if (value === null || value === undefined || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (DIRECT_IDENTIFIER_KEYS.test(key)) return "[verwijderd]";
    if (PARENT_KEYS.test(key) || CHILD_KEYS.test(key) || PARTNER_KEYS.test(key)) return labelForKey(key, counters);
    return scrubText(value);
  }
  if (Array.isArray(value)) return value.map((item) => anonymizeValue(item, key, counters));
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      if (DIRECT_IDENTIFIER_KEYS.test(childKey)) continue;
      output[childKey] = anonymizeValue(childValue, childKey, counters);
    }
    return output;
  }
  return "[verwijderd]";
}

export function anonymizeCalculationInput(input: unknown): unknown {
  return anonymizeValue(input, "root", { parent: 0, child: 0, partner: 0 });
}

export function buildAnonymizedCalculationExport(args: {
  input: unknown;
  calculation: unknown;
  warnings?: ExportWarning[];
  overrides?: unknown[];
  normVersion?: string;
  engineVersion?: string;
  reviewStatus?: string;
  approvalStatus?: string;
  generatedAt?: string;
}): AnonymizedCalculationExport {
  return {
    title: "GEANONIMISEERDE ALIMENTATIEBEREKENING",
    notice: "GEANONIMISEERD — uitsluitend voor ontwikkeling en controle",
    disclaimer: "Dit document is uitsluitend bedoeld voor ontwikkeling, testdata en controle. Het is geen juridisch advies en vervangt geen rechterlijke beslissing of overeenkomst.",
    generatedAt: args.generatedAt ?? new Date().toISOString(),
    normVersion: args.normVersion,
    engineVersion: args.engineVersion,
    reviewStatus: args.reviewStatus,
    approvalStatus: args.approvalStatus,
    input: anonymizeCalculationInput(args.input),
    calculation: anonymizeCalculationInput(args.calculation),
    warnings: args.warnings ?? [],
    overrides: anonymizeCalculationInput(args.overrides ?? []) as unknown[],
  };
}

export function validateCalculationConsistency(input: {
  income?: Array<{ field: string; mode?: string; grossAnnual?: number; netMonthly?: number }>;
  careDaysPerYear?: number;
  carePercentage?: number;
  registeredChildren?: number;
  calculatedChildren?: number;
  registeredObligations?: number;
  calculatedObligations?: number;
  partnerEntered?: boolean;
  partnerImpactExplained?: boolean;
  formulaOutputPresent?: boolean;
  reviewStatus?: string;
}): ExportWarning[] {
  const warnings: ExportWarning[] = [];
  for (const income of input.income ?? []) {
    if ((income.netMonthly ?? 0) > 0 && (income.grossAnnual ?? 0) === 0) {
      warnings.push({ field: income.field, currentValue: income, reason: "NBI is ingevuld terwijl bruto jaarinkomen € 0 is.", possibleImpact: "De inkomensbasis en daarmee de draagkracht kan onjuist of niet reproduceerbaar zijn." });
    }
    if (income.mode === "GROSS" && (income.grossAnnual ?? 0) === 0) {
      warnings.push({ field: `${income.field}.mode`, currentValue: income.mode, reason: "GROSS-modus is gekozen zonder bruto jaarinkomen.", possibleImpact: "De berekening kan geen betrouwbare bruto-naar-netto-berekening uitvoeren." });
    }
    if (income.mode === "NET" && (income.netMonthly ?? 0) === 0) {
      warnings.push({ field: `${income.field}.mode`, currentValue: income.mode, reason: "NET-modus is gekozen zonder netto maandinkomen.", possibleImpact: "De draagkracht kan te laag of ontbrekend worden berekend." });
    }
  }
  if (input.careDaysPerYear !== undefined && input.carePercentage !== undefined) {
    const expected = input.careDaysPerYear >= 156 ? 35 : input.careDaysPerYear >= 104 ? 25 : input.careDaysPerYear >= 52 ? 15 : 5;
    if (input.carePercentage !== expected) {
      warnings.push({ field: "carePercentage", currentValue: input.carePercentage, reason: "Het zorgkortingspercentage past niet bij het opgegeven aantal zorgdagen.", possibleImpact: "De zorgkorting en het eindbedrag kunnen afwijken." });
    }
  }
  if ((input.registeredChildren ?? 0) !== (input.calculatedChildren ?? input.registeredChildren ?? 0)) {
    warnings.push({ field: "children", currentValue: input.registeredChildren, reason: "Niet alle geregistreerde kinderen zijn zichtbaar in de draagkrachtberekening.", possibleImpact: "De gezamenlijke behoefte en draagkrachtverdeling kunnen onvolledig zijn." });
  }
  if ((input.registeredObligations ?? 0) !== (input.calculatedObligations ?? input.registeredObligations ?? 0)) {
    warnings.push({ field: "maintenanceObligations", currentValue: input.registeredObligations, reason: "Niet alle onderhoudsverplichtingen zijn meegenomen.", possibleImpact: "De draagkracht kan te hoog worden vastgesteld." });
  }
  if (input.partnerEntered && !input.partnerImpactExplained) {
    warnings.push({ field: "partner", currentValue: "ingevoerd", reason: "Partnergegevens zijn ingevoerd, maar de invloed op de draagkracht is niet inzichtelijk.", possibleImpact: "De gezins- en draagkrachtanalyse is niet volledig reproduceerbaar." });
  }
  if (!input.formulaOutputPresent) {
    warnings.push({ field: "calculation.formula", currentValue: "ontbreekt", reason: "De volledige formule-output ontbreekt.", possibleImpact: "Het eindbedrag kan niet onafhankelijk worden gecontroleerd." });
  }
  if (input.reviewStatus === "CONCEPT" || input.reviewStatus === "INCOMPLETE") {
    warnings.push({ field: "reviewStatus", currentValue: input.reviewStatus, reason: "De berekening is nog niet volledig gereviewd of goedgekeurd.", possibleImpact: "De uitkomst is uitsluitend voorlopig en mag niet als definitief worden gebruikt." });
  }
  return warnings;
}
