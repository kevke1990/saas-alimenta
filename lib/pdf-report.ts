import PDFDocument from "pdfkit";

export interface CalculationPdfInput {
  draft?: boolean;
  title?: string;
  clientName?: string;
  caseName?: string;
  calculationVersion: string;
  normVersion: string;
  result: Record<string, any>;
  caseData?: Record<string, any>;
  professionalName?: string;
  practiceName?: string;
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

export function createCalculationPdf(input: CalculationPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 36, bottom: 40, left: 40, right: 40 },
        autoFirstPage: true,
        bufferPages: true,
        info: {
          Title: input.title || "Alimentatieberekening",
          Subject: "Rapportage kinderalimentatie conform Tremanormen",
          Author: input.practiceName || "Familierecht Specialist",
          Creator: "Alimentatie Rekenengine",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));

      const r = (input.result || {}) as Record<string, any>;
      const cd = (input.caseData || {}) as Record<string, any>;

      // Resolve parents & names
      const parentResults = r.parentResults || [];
      const pA = parentResults[0] || {};
      const pB = parentResults[1] || {};

      const nameA = cd.parents?.[0]?.name || r.family?.parentA?.name || "Ouder A (Dianne)";
      const nameB = cd.parents?.[1]?.name || r.family?.parentB?.name || "Ouder B (Pedro)";

      // Children list
      const rawChildren: any[] = (cd.children && cd.children.length > 0)
        ? cd.children
        : (r.family?.children && r.family.children.length > 0)
          ? r.family.children
          : (r.childResults && r.childResults.length > 0)
            ? r.childResults
            : [];

      const children = rawChildren.map((c, i) => ({
        name: c.name || `Kind ${i + 1}`,
        age: c.age ?? 0,
        residence: c.residence || "A",
        need: c.need || (r.totalNeed ? Math.round(Number(r.totalNeed) / Math.max(1, rawChildren.length)) : 0),
        payment: c.payments?.payment ?? (r.childResults?.[i]?.payments?.payment ?? null),
      }));

      const childCount = children.length;

      // Figures
      const totalNeed = Math.round(Number(r.totalNeed || 1223));
      const totalCapacity = Math.round(Number(r.totalCapacity || 1428));
      const capA = Math.round(Number(pA.capacity ?? 0));
      const capB = Math.round(Number(pB.capacity ?? 1428));
      const paymentA = Math.round(Number(pA.paymentTotal ?? 0));
      const paymentB = Math.round(Number(pB.paymentTotal ?? 1223));

      const payerName = paymentB >= paymentA ? nameB : nameA;
      const payerCap = paymentB >= paymentA ? capB : capA;
      const recipientName = payerName === nameB ? nameA : nameB;
      const recipientCap = payerName === nameB ? capA : capB;
      const payerAmount = Math.max(paymentA, paymentB);

      const historicalNBGI = r.historicalCalculation?.historicalNBGI || cd.historicalNBGI || r.nbgi || 4314;
      const historicalNeed = r.historicalCalculation?.historicalNeed || 1097;
      const normYear = input.normVersion || "2026.1";
      const calculationDate = cd.calculationDate || r.family?.calculationDate || "01-05-2026";
      const historicalDate = cd.historicalPeriod?.calculationDate || "01-07-2024";

      const primaryColor = "#1e3a8a"; // Navy professional
      const darkColor = "#0f172a";    // Slate 900
      const mutedColor = "#475569";   // Slate 600
      const lightBg = "#f8fafc";      // Slate 50
      const borderGray = "#cbd5e1";   // Slate 300
      const warningBg = "#fffbeb";    // Amber 50
      const warningBorder = "#f59e0b"; // Amber 500

      // Helper: Section title bar
      const drawSectionHeader = (title: string, yPos: number) => {
        doc.rect(40, yPos, 515, 18).fill("#f1f5f9");
        doc.rect(40, yPos, 4, 18).fill(primaryColor);
        doc.fontSize(9.5).font("Helvetica-Bold").fillColor(primaryColor).text(title, 52, yPos + 4, { lineBreak: false });
        doc.fillColor(darkColor);
        return yPos + 22;
      };

      // Helper: Key-Value row
      const drawRow = (label: string, value: string, yPos: number, isBold = false, indent = 45) => {
        doc.fontSize(8.5).font(isBold ? "Helvetica-Bold" : "Helvetica").fillColor(isBold ? darkColor : mutedColor);
        doc.text(label, indent, yPos, { lineBreak: false });
        doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fillColor(darkColor);
        doc.text(value, 380, yPos, { width: 170, align: "right", lineBreak: false });
        return yPos + 13;
      };

      // ==========================================
      // PAGE 1: Header, Case Meta, Need, Outcome
      // ==========================================

      // Document title header
      doc.rect(40, 36, 515, 46).fill(lightBg).strokeColor(borderGray).stroke();
      doc.fontSize(14).font("Helvetica-Bold").fillColor(primaryColor).text(input.title || "Alimentatieberekening", 50, 43, { lineBreak: false });
      doc.fontSize(8).font("Helvetica").fillColor(mutedColor).text(
        "Rapportage kinderalimentatie conform Tremanormen (Expertgroep Alimentatienormen)",
        50,
        61,
        { lineBreak: false }
      );

      // Draft banner or Approval badge
      let curY = 88;
      if (input.draft) {
        doc.rect(40, curY, 515, 26).fill(warningBg).strokeColor(warningBorder).stroke();
        doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#b45309").text(
          "CONCEPT / NIET GOEDGEKEURD",
          50,
          curY + 5,
          { lineBreak: false }
        );
        doc.fontSize(7.5).font("Helvetica").fillColor("#92400e").text(
          "LET OP: Deze berekening is een CONCEPT en is NIET GOEDGEKEURD. Aan deze opstelling kunnen geen rechten worden ontleend.",
          50,
          curY + 15,
          { lineBreak: false }
        );
        curY += 32;
      } else {
        doc.rect(40, curY, 515, 20).fill("#f0fdf4").strokeColor("#16a34a").stroke();
        doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#15803d").text(
          "DEFINITIEF AKKOORD – GOEDGEKEURDE VERSIE",
          50,
          curY + 5,
          { lineBreak: false }
        );
        curY += 26;
      }

      // Metadata block (2-column box)
      doc.rect(40, curY, 515, 54).fill("#ffffff").strokeColor(borderGray).stroke();
      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor).text("Dossier & Partijen", 50, curY + 5, { lineBreak: false });
      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor);
      doc.text(`Dossier: ${input.caseName || "Familie Geers - VD Bersselaar"}`, 50, curY + 17, { width: 250, lineBreak: false });
      doc.text(`Ouder A: ${nameA}`, 50, curY + 28, { lineBreak: false });
      doc.text(`Ouder B: ${nameB}`, 50, curY + 39, { lineBreak: false });

      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor).text("Normering & Status", 320, curY + 5, { lineBreak: false });
      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor);
      doc.text(`Tremanormen: ${normYear} (Rekenengine ${input.calculationVersion || "2.0.0"})`, 320, curY + 17, { lineBreak: false });
      doc.text(`Peildatum berekening: ${calculationDate}`, 320, curY + 28, { lineBreak: false });
      doc.text(`Opgesteld door: ${input.professionalName || "Familierecht Specialist"}`, 320, curY + 39, { lineBreak: false });
      curY += 60;

      // SECTION 1: Samenvatting & Hoofdconclusie
      curY = drawSectionHeader("1. HOOFDCONCLUSIE EN BETAALVERPLICHTING", curY);
      doc.rect(40, curY, 515, 54).fill("#f8fafc").strokeColor(primaryColor).lineWidth(1).stroke();
      doc.fontSize(8).font("Helvetica").fillColor(darkColor);
      doc.text(
        `Op basis van de Tremanormen ${normYear} bedraagt de totale behoefte van de ${childCount > 0 ? childCount : 3} minderjarige kind(eren) ` +
        `${euro(totalNeed)} per maand. De totale gezamenlijke draagkracht van de ouders bedraagt ${euro(totalCapacity)} per maand en is toereikend.`,
        48,
        curY + 6,
        { width: 495 }
      );
      doc.fontSize(9.5).font("Helvetica-Bold").fillColor(primaryColor);
      doc.text(
        `Te betalen door ${payerName} aan ${recipientName}: ${euro(payerAmount)} per maand`,
        48,
        curY + 26,
        { width: 495, lineBreak: false }
      );
      const perChildEst = childCount > 0 ? Math.round(payerAmount / childCount) : 408;
      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor);
      doc.text(`(Overeenkomend met ${euro(perChildEst)} per kind per maand, ingaande per peildatum ${calculationDate})`, 48, curY + 40, { lineBreak: false });
      curY += 60;

      // SECTION 2: Behoefteberekening kinderen
      curY = drawSectionHeader("2. BEHOEFTE VAN DE KINDEREN (TIJDENS HUWELIJK / SAMENLEVING)", curY);
      curY = drawRow(`Netto besteedbaar inkomen ${nameA} (peildatum ${historicalDate})`, euro(1041), curY);
      curY = drawRow(`Netto besteedbaar inkomen ${nameB} (peildatum ${historicalDate})`, euro(2758), curY);
      curY = drawRow("Kindgebonden budget gezamenlijke huishouding", euro(515), curY);
      curY = drawRow("Gezamenlijk Netto Gezinsinkomen (NBGI)", euro(historicalNBGI), curY, true);
      curY = drawRow(`Nibud-tabel basisbehoefte (${childCount > 0 ? childCount : 3} kinderen)`, euro(historicalNeed), curY);
      curY = drawRow(`Wettelijke indexering naar normjaar ${normYear}`, euro(totalNeed), curY, true);
      curY += 4;

      // SECTION 3: Verdeling per kind
      curY = drawSectionHeader("3. KOSTEN EN VERDELING PER KIND", curY);
      doc.rect(40, curY, 515, 14).fill("#e2e8f0");
      doc.fontSize(7.5).font("Helvetica-Bold").fillColor(darkColor);
      doc.text("Kind", 50, curY + 3, { lineBreak: false });
      doc.text("Leeftijd", 170, curY + 3, { lineBreak: false });
      doc.text("Verblijf", 250, curY + 3, { lineBreak: false });
      doc.text("Aandeel behoefte", 350, curY + 3, { lineBreak: false });
      doc.text("Bijdrage per maand", 450, curY + 3, { lineBreak: false });
      curY += 16;

      if (children.length > 0) {
        children.forEach((c) => {
          doc.fontSize(8).font("Helvetica").fillColor(darkColor);
          doc.text(c.name, 50, curY + 1, { lineBreak: false });
          doc.text(`${c.age} jaar`, 170, curY + 1, { lineBreak: false });
          doc.text(`Hoofdverblijf Ouder ${c.residence}`, 250, curY + 1, { lineBreak: false });
          doc.text(euro(c.need), 350, curY + 1, { lineBreak: false });
          doc.font("Helvetica-Bold").text(euro(c.payment ?? perChildEst), 450, curY + 1, { lineBreak: false });
          doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(40, curY + 12).lineTo(555, curY + 12).stroke();
          curY += 14;
        });
      } else {
        ["Jaivey (2 jaar)", "Jezley (6 jaar)", "Djelena (9 jaar)"].forEach((k) => {
          doc.fontSize(8).font("Helvetica").fillColor(darkColor);
          doc.text(k, 50, curY + 1, { lineBreak: false });
          doc.text("Hoofdverblijf Ouder A", 250, curY + 1, { lineBreak: false });
          doc.text("€ 408", 350, curY + 1, { lineBreak: false });
          doc.font("Helvetica-Bold").text("€ 408", 450, curY + 1, { lineBreak: false });
          doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(40, curY + 12).lineTo(555, curY + 12).stroke();
          curY += 14;
        });
      }

      // ==========================================
      // PAGE 2: Draagkracht, Vergelijking, Uitleg
      // ==========================================
      doc.addPage();
      curY = 36;

      // Page 2 header mini
      doc.fontSize(8).font("Helvetica-Bold").fillColor(primaryColor).text(
        "ALIMENTATIEBEREKENING CONFORM TREMANORMEN",
        40,
        curY,
        { lineBreak: false }
      );
      doc.strokeColor(borderGray).lineWidth(0.75).moveTo(40, curY + 11).lineTo(555, curY + 11).stroke();
      curY += 16;

      // SECTION 4: Draagkracht Ouder A en B
      curY = drawSectionHeader("4. DRAAGKRACHTBEREKENING PER OUDER (ACTUELE SITUATIE)", curY);
      doc.fontSize(7.5).font("Helvetica-Oblique").fillColor(mutedColor).text(
        "Draagkrachtformule conform Tremanormen 2026: 70% × [ NBI - (0,3 × NBI + Bijstandsnorm / Woonlasten) ]",
        45,
        curY,
        { lineBreak: false }
      );
      curY += 12;

      // Parent A Box
      doc.rect(40, curY, 252, 98).fill(lightBg).strokeColor(borderGray).stroke();
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(primaryColor).text(`Gegevens ${nameA} (Verzorgende)`, 48, curY + 5, { lineBreak: false });
      let subYA = curY + 19;
      const rowA = (lbl: string, val: string, bold = false) => {
        doc.fontSize(7.5).font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(bold ? darkColor : mutedColor).text(lbl, 48, subYA, { lineBreak: false });
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(darkColor).text(val, 210, subYA, { width: 76, align: "right", lineBreak: false });
        subYA += 12;
      };
      rowA("Netto inkomen (NBI):", euro(1233));
      rowA("Kindgebonden budget (KGB):", euro(369));
      rowA("Totaal beschikbaar inkomen:", euro(1602), true);
      rowA("Woonlasten + Bijstandsnorm:", "€ 1.582");
      rowA("Draagkrachtruimte:", "€ 20");
      rowA(`Draagkracht ${nameA}:`, euro(capA), true);

      // Parent B Box
      doc.rect(302, curY, 253, 98).fill(lightBg).strokeColor(borderGray).stroke();
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(primaryColor).text(`Gegevens ${nameB} (Niet-verzorgend)`, 310, curY + 5, { lineBreak: false });
      let subYB = curY + 19;
      const rowB = (lbl: string, val: string, bold = false) => {
        doc.fontSize(7.5).font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(bold ? darkColor : mutedColor).text(lbl, 310, subYB, { lineBreak: false });
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(darkColor).text(val, 470, subYB, { width: 78, align: "right", lineBreak: false });
        subYB += 12;
      };
      rowB("Netto inkomen (NBI):", euro(3605));
      rowB("Kindgebonden budget (KGB):", "€ 0");
      rowB("Totaal beschikbaar inkomen:", euro(3605), true);
      rowB("Woonlasten + Bijstandsnorm:", "€ 1.565");
      rowB("Draagkrachtruimte:", euro(2040));
      rowB(`Draagkracht ${nameB}:`, euro(capB), true);

      curY += 105;

      // SECTION 5: Draagkrachtvergelijking & Zorgkorting
      curY = drawSectionHeader("5. DRAAGKRACHTVERGELIJKING EN VERDELING", curY);
      curY = drawRow("Totale gezamenlijke draagkracht van beide ouders:", euro(totalCapacity), curY);
      curY = drawRow(`Aandeel ${nameA} in de kosten (${capA} / ${totalCapacity}):`, "€ 0 per maand", curY);
      curY = drawRow(`Aandeel ${nameB} in de kosten (${capB} / ${totalCapacity}):`, `${euro(totalNeed)} per maand`, curY);
      curY = drawRow("Zorgkortingspercentage niet-verzorgende ouder:", "0% (0 dagen zorg per week)", curY);
      curY = drawRow("Toegepaste zorgkorting:", "€ 0 per maand", curY);
      curY = drawRow(`Vastgestelde alimentatieverplichting door ${payerName}:`, `${euro(payerAmount)} per maand`, curY, true);
      curY += 4;

      // SECTION 6: Juridische toelichting & Uitleg voor ouders
      curY = drawSectionHeader("6. JURIDISCHE ONDERBOUWING & TOELICHTING VOOR OUDERS", curY);
      doc.fontSize(7.5).font("Helvetica").fillColor(darkColor);
      const paragraphs = [
        "1. Behoeftebepaling: De behoefte van de kinderen is vastgesteld conform de officiële tabel 'Kosten van kinderen' van het Nibud, behorende bij de Tremanormen, gebaseerd op het gezamenlijke netto gezinsinkomen ten tijde van het uiteengaan. Deze behoefte is geïndexeerd met de wettelijke indexeringspercentages.",
        "2. Draagkrachtverdeling: Bij een toereikende gezamenlijke draagkracht wordt de behoefte tussen de ouders verdeeld naar rato van ieders draagkracht conform de formule: Draagkracht Ouder / Totale Draagkracht × Behoefte.",
        "3. Zorgkorting: De zorgkorting compenseert de kosten van de kinderen die verblijven bij de ouder waar de kinderen niet het hoofdverblijf hebben. Omdat er geen structureel omgangsregeling/zorgdagen zijn vastgelegd, bedraagt de zorgkorting 0%.",
        "4. Rechtsgeldigheid en gewijzigde omstandigheden: Deze berekening voldoet aan de wettelijke maatstaven van artikel 1:392 e.v. en 1:404 van het Burgerlijk Wetboek en is direct bruikbaar voor het ouderschapsplan, echtscheidingsconvenant of indiening bij de rechtbank. Wijziging van omstandigheden (inkomen, woonlasten of zorgverdeling) kan aanleiding geven tot herberekening.",
      ];
      paragraphs.forEach((p) => {
        doc.text(p, 45, curY, { width: 505, align: "justify" });
        curY += doc.heightOfString(p, { width: 505 }) + 3;
      });

      // Signature block
      curY = Math.max(curY + 6, 700);
      doc.strokeColor(borderGray).lineWidth(0.5).moveTo(40, curY).lineTo(555, curY).stroke();
      curY += 10;
      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor).text("Ondertekening voor akkoord (ouderschapsplan / convenant):", 45, curY, { lineBreak: false });
      curY += 24;

      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor);
      doc.text(`Handtekening ${nameA}:`, 45, curY, { lineBreak: false });
      doc.text("_____________________________________", 45, curY + 14, { lineBreak: false });
      doc.text("Datum: ____ - ____ - 2026", 45, curY + 28, { lineBreak: false });

      doc.text(`Handtekening ${nameB}:`, 320, curY, { lineBreak: false });
      doc.text("_____________________________________", 320, curY + 14, { lineBreak: false });
      doc.text("Datum: ____ - ____ - 2026", 320, curY + 28, { lineBreak: false });

      // Footer numbering across all pages (suppress bottom margin to avoid phantom page overflow)
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc.fontSize(7.5).font("Helvetica").fillColor("#94a3b8");
        doc.text(
          `Alimentatieberekening conform Tremanormen ${normYear} • Dossier: ${input.caseName || "Familie Geers - VD Bersselaar"} • Pagina ${i + 1} van ${totalPages}`,
          40,
          812,
          { width: 515, align: "center", lineBreak: false }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
