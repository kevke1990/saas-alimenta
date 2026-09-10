type PdfLine = { text: string; size?: number; bold?: boolean };

const esc = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "?");

function pageContent(lines: PdfLine[]) {
  let y = 800;
  const out: string[] = ["BT"];
  for (const line of lines) {
    const size = line.size ?? 10;
    if (line.bold) out.push("/F2 " + size + " Tf"); else out.push("/F1 " + size + " Tf");
    out.push("50 " + y + " Td");
    out.push("(" + esc(line.text.slice(0, 115)) + ") Tj");
    out.push("-50 " + y + " Td");
    y -= size >= 16 ? 26 : 17;
    if (y < 55) break;
  }
  out.push("ET");
  return out.join("\\n");
}

function buildPdf(content: string) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>",
    "<< /Length " + Buffer.byteLength(content, "latin1") + " >>\\nstream\\n" + content + "\\nendstream",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  let pdf = "%PDF-1.4\\n";
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\\n${objects[i]}\\nendobj\\n`;
  }
  const xref = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\\n0 ${objects.length + 1}\\n0000000000 65535 f \\n`;
  for (let i = 1; i <= objects.length; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \\n`;
  pdf += `trailer\\n<< /Size ${objects.length + 1} /Root 1 0 R >>\\nstartxref\\n${xref}\\n%%EOF\\n`;
  return Buffer.from(pdf, "latin1");
}

export function createCalculationPdf(input: {
  title?: string;
  clientName?: string;
  caseName?: string;
  calculationVersion: string;
  normVersion: string;
  result: Record<string, unknown>;
  professionalName?: string;
  practiceName?: string;
}) {
  const r = input.result as Record<string, any>;
  const lines: PdfLine[] = [
    { text: input.title || "Alimenta Pro – Alimentatieberekening", size: 18, bold: true },
    { text: input.practiceName || "", size: 10, bold: true },
    { text: `Cliënt: ${input.clientName || "Onbekend"}` },
    { text: `Dossier: ${input.caseName || "Onbekend"}` },
    { text: `Rekenengine: ${input.calculationVersion} | Norm: ${input.normVersion}` },
    { text: "" },
    { text: "Samenvatting", size: 14, bold: true },
  ];
  if (typeof r.totalNeed === "number") lines.push({ text: `Eigen aandeel kinderen: € ${Math.round(r.totalNeed)} per maand` });
  if (Array.isArray(r.transfers)) {
    for (const t of r.transfers as any[]) lines.push({ text: `Kind ${t.childIndex}: ${t.direction}, bijdrage € ${Math.round(t.payment)} p/m, zorgkorting € ${Math.round(t.careDiscount)}` });
  }
  if (typeof r.netPartnerSupport === "number") lines.push({ text: `Partneralimentatie: € ${Math.round(r.netPartnerSupport)} netto per maand` });
  if (typeof r.additionalNeed === "number") lines.push({ text: `Aanvullende behoefte partner: € ${Math.round(r.additionalNeed)} netto per maand` });
  lines.push({ text: "" }, { text: "Methodiek en aandachtspunten", size: 14, bold: true });
  if (Array.isArray(r.warnings)) for (const warning of r.warnings as string[]) lines.push({ text: `• ${warning}` });
  lines.push(
    { text: "" },
    { text: `Opgesteld door: ${input.professionalName || "Alimenta Pro"}` },
    { text: "Dit rapport is een rekenkundige uitwerking en geen juridisch advies." },
    { text: "Bron: Rapport Alimentatienormen 2026, Expertgroep Alimentatie." },
  );
  return buildPdf(pageContent(lines));
}
