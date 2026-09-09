export const PROFESSIONAL_REVIEW_SECTIONS = [
  { key: "INPUT", label: "Invoer", description: "Ouders, kinderen, inkomen, wonen en gezinssituatie gecontroleerd." },
  { key: "CHILD_SUPPORT", label: "Kinderalimentatie", description: "Behoefte, draagkracht, zorgkorting en bijdragen gecontroleerd." },
  { key: "PARTNER_SUPPORT", label: "Partneralimentatie", description: "PAL-behoefte, draagkracht, prioriteit en duur gecontroleerd." },
  { key: "CALCULATION", label: "Berekening", description: "Rekenstappen, waarschuwingen en norm/engine gecontroleerd." },
  { key: "OVERRIDES", label: "Professionele afwijkingen", description: "Alle overrides beoordeeld en gemotiveerd." },
  { key: "PROVENANCE", label: "Provenance", description: "Actuele snapshot, fingerprint, engine en norm gecontroleerd." },
  { key: "REPORT", label: "Rapport", description: "Rapportuitkomst en betalingsverplichting gecontroleerd." },
] as const;

export type ProfessionalReviewSection = (typeof PROFESSIONAL_REVIEW_SECTIONS)[number]["key"];

export function isProfessionalReviewSection(value: unknown): value is ProfessionalReviewSection {
  return PROFESSIONAL_REVIEW_SECTIONS.some((x) => x.key === value);
}

export function buildProfessionalReviewState(logs: Array<{ action: string; metadata: unknown }>, calculationId?: string | null) {
  const checked = new Set<string>();
  for (const log of logs) {
    if (log.action !== "CASE_REVIEW_CHECKED") continue;
    const metadata = (log.metadata && typeof log.metadata === "object" ? log.metadata : {}) as Record<string, unknown>;
    if (calculationId && metadata.calculationId !== calculationId) continue;
    if (typeof metadata.section === "string") checked.add(metadata.section);
  }
  const sections = PROFESSIONAL_REVIEW_SECTIONS.map((section) => ({
    ...section,
    checked: checked.has(section.key),
  }));
  return {
    sections,
    checkedCount: sections.filter((x) => x.checked).length,
    totalCount: sections.length,
    complete: sections.every((x) => x.checked),
  };
}
