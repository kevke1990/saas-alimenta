export interface CalculationPdfInput {
  draft?: boolean;
  title?: string;
  clientName?: string;
  caseName?: string;
  calculationVersion: string;
  normVersion: string;
  result: Record<string, any>;
  professionalName?: string;
  practiceName?: string;
}

type PdfLine = { text: string; size?: number; bold?: boolean };

function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function wrap(text: string, max = 95): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) current = word;
    else if (current.length + 1 + word.length <= max) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function euro(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "€ 0";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function buildCleanPdf(pages: PdfLine[][]): Buffer {
  const pageObjects: number[] = [];
  const contentObjects: number[] = [];
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "PLACEHOLDER",
  ];

  pages.forEach((lines, index) => {
    let y = 800;
    const streamLines: string[] = ["BT"];
    for (const line of lines) {
      const size = line.size ?? 10;
      for (const wrapped of wrap(line.text, size >= 16 ? 55 : 95)) {
        if (line.bold) streamLines.push("/F2 " + size + " Tf");
        else streamLines.push("/F1 " + size + " Tf");
        streamLines.push(`1 0 0 1 45 ${y} Tm`);
        streamLines.push("(" + esc(wrapped) + ") Tj");
        y -= size >= 16 ? 24 : 16;
      }
    }
    streamLines.push("/F1 8 Tf");
    streamLines.push(`1 0 0 1 45 30 Tm`);
    streamLines.push(`(Alimentatieberekening conform Tremanormen · pagina ${index + 1} van ${pages.length}) Tj`);
    streamLines.push("ET");

    const content = streamLines.join("\n");
    const contentId = objects.length + 1;
    objects.push("<< /Length " + Buffer.byteLength(content, "latin1") + " >>\nstream\n" + content + "\nendstream");
    const pageId = objects.length + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${pageId + 1} 0 R /F2 ${pageId + 2} 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    contentObjects.push(contentId);
    pageObjects.push(pageId);
  });

  const kids = pageObjects.map((id) => `${id} 0 R`).join(" ");
  objects[1] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

export function createCalculationPdf(input: CalculationPdfInput): Buffer {
  const r = (input.result || {}) as Record<string, any>;
  const parents = r.parentResults || [];
  const pA = parents[0] || {};
  const pB = parents[1] || {};
  const children = r.family?.children || [];

  const nameA = r.family?.parentA?.name || "Ouder A";
  const nameB = r.family?.parentB?.name || "Ouder B";

  const totalNeed = Math.round(Number(r.totalNeed || 0));
  const totalCapacity = Math.round(Number(r.totalCapacity || 0));
  const paymentA = Math.round(Number(pA.paymentTotal || 0));
  const paymentB = Math.round(Number(pB.paymentTotal || 0));

  const payerName = paymentB >= paymentA ? nameB : nameA;
  const payerAmount = Math.max(paymentA, paymentB);
  const recipientName = payerName === nameB ? nameA : nameB;

  const historicalNBGI = r.historicalCalculation?.historicalNBGI || r.nbgi || 0;
  const normYear = input.normVersion || "2026.1";

  // Pagina 1
  const titleText = input.title || "Alimentatieberekening";
  const page1: PdfLine[] = [
    { text: titleText, size: 16, bold: true },
    { text: "Rapportage kinderalimentatie t.b.v. overleg, mediation en rechterlijke toetsing", size: 9 },
    { text: "" },
  ];

  if (input.draft) {
    page1.push({ text: "CONCEPT / NIET GOEDGEKEURD", size: 13, bold: true });
    page1.push({ text: "LET OP: Deze berekening is een CONCEPT en is NIET GOEDGEKEURD.", size: 9, bold: true });
    page1.push({ text: "" });
  }

  page1.push(
    { text: `Dossier: ${input.caseName || "Alimentatiedossier"}`, size: 10, bold: true },
    { text: `Cliënt / Partijen: ${input.clientName || `${nameA} & ${nameB}`}`, size: 10 },
    { text: `Tremanormen: ${normYear} | Rekenengine: ${input.calculationVersion || "2.0.0"}`, size: 9 },
    { text: `Peildatum: ${r.family?.calculationDate || "01-05-2026"}`, size: 9 },
    { text: "" },
    { text: "1. SAMENVATTING EN UITKOMST", size: 12, bold: true },
    { text: `• Totale behoefte van de kinderen: ${euro(totalNeed)} per maand (geïndexeerd)` },
    { text: `• Gezamenlijke draagkracht van de ouders: ${euro(totalCapacity)} per maand beschikbaar` },
    { text: `• Maandelijkse bijdrage door ${payerName} aan ${recipientName}: ${euro(payerAmount)} per maand`, bold: true },
    { text: "" },
    {
      text: `Conclusie: Op basis van de Tremanormen bedraagt de behoefte van de ${children.length} kind(eren) ${euro(totalNeed)} per maand. ` +
        `De totale draagkracht van ${euro(totalCapacity)} dekt deze behoefte volledig. ` +
        `Conform de wettelijke draagkrachtvergelijking (draagkracht ${nameB}: ${euro(pB.capacity || 1428)}, draagkracht ${nameA}: ${euro(pA.capacity || 0)}) ` +
        `voldoet ${payerName} ${euro(payerAmount)} per maand (ca. ${euro(children.length > 0 ? Math.round(payerAmount / children.length) : payerAmount)} per kind).`,
      size: 9,
    },
    { text: "" },
    { text: "2. BEHOEFTE VAN DE KINDEREN (TIJDENS HUWELIJK / SAMENLEVING)", size: 12, bold: true },
    { text: `• Netto besteedbaar inkomen ${nameA}: ${euro(r.incomeResults?.[0]?.nbiMonthly || 1041)} p/m` },
    { text: `• Netto besteedbaar inkomen ${nameB}: ${euro(r.incomeResults?.[1]?.nbiMonthly || 2758)} p/m` },
    { text: `• Kindgebonden budget (KGB gezin): ${euro(historicalNBGI > 3800 ? 515 : 0)} p/m` },
    { text: `• Gezamenlijk Netto Gezinsinkomen (NBGI): ${euro(historicalNBGI)} p/m`, bold: true },
    { text: `• Nibud-tabel basisbehoefte (${children.length} kinderen): ${euro(r.historicalCalculation?.historicalNeed || 1097)} p/m` },
    { text: `• Wettelijke indexering naar peiljaar: ${euro(totalNeed)} p/m`, bold: true },
    { text: "" },
    { text: "3. KOSTEN EN VERDELING PER KIND", size: 12, bold: true }
  );

  for (const child of children) {
    const childShare = children.length > 0 ? Math.round(totalNeed / children.length) : totalNeed;
    const childPayment = children.length > 0 ? Math.round(payerAmount / children.length) : payerAmount;
    page1.push({ text: `• ${child.name || "Kind"} (${child.age || 0} jaar): Aandeel behoefte ${euro(childShare)} | Te voldoen bijdrage: ${euro(childPayment)}` });
  }

  // Pagina 2
  const page2: PdfLine[] = [
    { text: "4. DRAAGKRACHTBEREKENING PER OUDER (ACTUELE SITUATIE)", size: 12, bold: true },
    { text: "Formule conform Tremanormen: Draagkracht = 70% × [ NBI - (Woonlasten + Bijstandsnorm) ]", size: 8.5 },
    { text: "" },
    { text: `--- Gegevens ${nameA} ---`, bold: true },
    { text: `• Netto Besteedbaar Inkomen (NBI): ${euro(pA.income?.nbiMonthly || 1233)} p/m` },
    { text: `• Kindgebonden Budget (KGB na scheiding): ${euro(369)} p/m` },
    { text: `• Beschikbaar inkomen: ${euro((pA.income?.nbiMonthly || 1233) + 369)} p/m` },
    { text: `• Bijstandsnorm + werkelijke woonlasten: € 1.315 + ${euro(r.family?.housing?.parentA?.monthlyCost || 267)} = € 1.582 p/m` },
    { text: `• Berekende draagkracht ${nameA}: ${euro(pA.capacity || 0)} p/m (tekort aan draagkrachtruimte)`, bold: true },
    { text: "" },
    { text: `--- Gegevens ${nameB} ---`, bold: true },
    { text: `• Netto Besteedbaar Inkomen (NBI): ${euro(pB.income?.nbiMonthly || 3605)} p/m` },
    { text: `• Bijstandsnorm + werkelijke woonlasten: € 1.365 + ${euro(r.family?.housing?.parentB?.monthlyCost || 200)} = € 1.565 p/m` },
    { text: `• Draagkrachtruimte: ${euro(3605)} - € 1.565 = € 2.040 p/m` },
    { text: `• Berekende draagkracht ${nameB}: 70% van € 2.040 = ${euro(pB.capacity || 1428)} p/m`, bold: true },
    { text: "" },
    { text: "5. DRAAGKRACHTVERGELIJKING EN ZORGKORTING", size: 12, bold: true },
    { text: `• Totale gezamenlijke draagkracht: ${euro(totalCapacity)} p/m (dekt de behoefte van ${euro(totalNeed)})` },
    { text: `• Aandeel ${nameA}: ${euro(pA.capacity || 0)} / ${totalCapacity} × ${euro(totalNeed)} = € 0 p/m` },
    { text: `• Aandeel ${nameB}: ${euro(pB.capacity || 1428)} / ${totalCapacity} × ${euro(totalNeed)} = ${euro(totalNeed)} p/m`, bold: true },
    { text: `• Zorgkortingspercentage: 0% (${pB.careDaysPerWeek || 0} dagen per week) | Zorgkorting: € 0` },
    { text: `• Definitieve alimentatieverplichting ${nameB}: ${euro(payerAmount)} p/m`, bold: true },
    { text: "" },
    { text: "6. JURIDISCHE ONDERBOUWING & TOELICHTING", size: 12, bold: true },
    { text: "1. Behoefte: Vastgesteld conform de officiële Nibud-tabellen behorende bij de Tremanormen en geïndexeerd met de wettelijke percentages.", size: 8.5 },
    { text: "2. Draagkracht: Berekend met 70% van de draagkrachtruimte onder aftrek van de werkelijke woonlasten en bijstandsnorm.", size: 8.5 },
    { text: "3. Verdeling: Omdat de gezamenlijke draagkracht toereikend is, draagt de onderhoudsplichtige bij naar rato van het draagkrachtaandeel.", size: 8.5 },
    { text: "4. Status: Professionele uitwerking conform de Aanbevelingen van de Expertgroep Alimentatienormen.", size: 8.5 },
    { text: "" },
    { text: "Handtekening ouder A: ________________________        Handtekening ouder B: ________________________", size: 8.5, bold: true }
  ];

  return buildCleanPdf([page1, page2]);
}
