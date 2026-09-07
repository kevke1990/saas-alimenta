export type LegalExceptionSeverity = "WARNING" | "INFO";

export type LegalException = {
  key: string;
  severity: LegalExceptionSeverity;
  title: string;
  detail: string;
  action: string;
};

const n = (v: unknown) => {
  const value = Number(v);
  return Number.isFinite(value) ? value : 0;
};

/**
 * Produces deterministic professional-review signals for legal/exceptional
 * circumstances. It deliberately does not decide the legal consequence.
 */
export function detectLegalExceptions(data: any): LegalException[] {
  const d = data || {};
  const parents = Array.isArray(d.parents) ? d.parents : [];
  const children = Array.isArray(d.children) ? d.children : [];
  const result: LegalException[] = [];
  const add = (key: string, title: string, detail: string, action: string, severity: LegalExceptionSeverity = "WARNING") =>
    result.push({ key, severity, title, detail, action });

  if (d.partnerSupport?.enabled) {
    const exception = d.partnerSupport.durationException;
    if (exception && exception !== "NONE") {
      add(
        "partner.duration.exception",
        "Bijzondere duurgrond partneralimentatie",
        "Er is een bijzondere duurgrond voor partneralimentatie geselecteerd. De juridische toepasselijkheid en peildatum moeten door de professional worden gecontroleerd.",
        "Controleer de relatiegegevens, peildatum, wettelijke grond en eventuele rechterlijke afspraak."
      );
    } else {
      add(
        "partner.duration.review",
        "Partneralimentatie: duur controleren",
        "Partneralimentatie is actief. De wettelijke duur en eventuele uitzonderingen zijn een afzonderlijk professioneel beoordelingspunt.",
        "Controleer de toepasselijke duur, ingangsdatum en eventuele uitzonderingsgrond.",
        "INFO"
      );
    }

    if (d.partnerSupport.incomeComparisonEnabled) {
      add(
        "partner.income.comparison",
        "Inkomensvergelijking partneralimentatie",
        "Een inkomensvergelijking is ingeschakeld. Controleer welke inkomensgegevens en uitgangspunten hiervoor zijn gebruikt.",
        "Controleer de gebruikte inkomensperioden, bewijsstukken en professionele onderbouwing.",
        "INFO"
      );
    }
  }

  parents.forEach((p: any, index: number) => {
    const partner = p?.newPartner;
    if (partner?.present) {
      add(
        `parent.${index}.newpartner`,
        `Nieuwe partner bij persoon ${String.fromCharCode(65 + index)}`,
        "Een nieuwe partner is als aanwezig geregistreerd. De relevante gezinssituatie en eventuele financiële gevolgen moeten afzonderlijk professioneel worden beoordeeld.",
        "Controleer relatievorm, samenwoning, inkomen en de relevante juridische context."
      );
      if (Array.isArray(partner.children) && partner.children.length) {
        add(
          `parent.${index}.newpartner.children`,
          `Kinderen van nieuwe partner bij persoon ${String.fromCharCode(65 + index)}`,
          `${partner.children.length} kind(eren) van de nieuwe partner zijn geregistreerd. Dit vraagt controle van onderhoudspositie en feitelijke gezinssituatie.`,
          "Controleer leeftijd, woonvorm, eigen inkomen en onderhoudspositie van deze kinderen.",
          "INFO"
        );
      }
    }

    if (p?.aow) {
      add(
        `parent.${index}.aow`,
        `AOW-signaal bij persoon ${String.fromCharCode(65 + index)}`,
        "AOW is als aanwezig geregistreerd. Controleer of de gebruikte inkomens- en draagkrachtuitgangspunten aansluiten op de feitelijke situatie.",
        "Controleer AOW, aanvullend pensioen en overige inkomsten op de peildatum.",
        "INFO"
      );
    }

    if (p?.housing?.type === "OWNED") {
      add(
        `parent.${index}.owned.home`,
        `Eigen woning bij persoon ${String.fromCharCode(65 + index)}`,
        "Een eigen woning is geregistreerd. De fiscale en woonlastgegevens kunnen maatwerkcontrole vereisen.",
        "Controleer hypotheekrente, aflossing, woningwaarde en eventuele fiscale verwerking.",
        "INFO"
      );
    }
  });

  const adultChildren = children.filter((c: any) => n(c.age) >= 18);
  if (adultChildren.length) {
    add(
      "children.adult",
      "Meerderjarige kinderen",
      `${adultChildren.length} kind(eren) zijn 18 jaar of ouder. De toepasselijke onderhouds- en opleidingssituatie moet per kind worden gecontroleerd.`,
      "Controleer opleiding, eigen inkomsten, woonvorm en relevante bewijsstukken."
    );
  }

  if (n(d.assetsA) > 0 || n(d.assetsB) > 0) {
    add(
      "assets.review",
      "Vermogensgegevens aanwezig",
      "Er zijn vermogensgegevens op dossierniveau geregistreerd. Controleer of en hoe deze gegevens juridisch/rekenkundig relevant zijn.",
      "Controleer bron, peildatum, waardering en de gekozen verwerking in de berekening.",
      "INFO"
    );
  }

  return result;
}
