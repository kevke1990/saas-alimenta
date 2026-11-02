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

function pct(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return "0%";
  return `${Math.round(value * 100) / 100}%`;
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

      const nameA = cd.parents?.[0]?.name || r.family?.parentA?.name || "Ouder A";
      const nameB = cd.parents?.[1]?.name || r.family?.parentB?.name || "Ouder B";

      // Children resolution
      const rawChildren: any[] = (cd.children && cd.children.length > 0)
        ? cd.children
        : (r.family?.children && r.family.children.length > 0)
          ? r.family.children
          : (r.childResults && r.childResults.length > 0)
            ? r.childResults
            : [];

      const children = rawChildren.map((c, i) => {
        const childRes = r.childResults?.[i] || {};
        return {
          name: c.name || `Kind ${i + 1}`,
          age: c.age ?? childRes.age ?? 0,
          residence: c.residence || childRes.residence || "A",
          need: childRes.need || c.need || (r.totalNeed ? Math.round(Number(r.totalNeed) / Math.max(1, rawChildren.length)) : 0),
          payment: childRes.payments?.payment ?? c.payments?.payment ?? null,
          careDiscount: childRes.payments?.careDiscount ?? childRes.careDiscount ?? null,
        };
      });

      const childCount = children.length;

      // Figures
      const totalNeed = Math.round(Number(r.totalNeed || 0));

      const rawCapA = Number(pA.capacity ?? 0);
      const rawCapB = Number(pB.capacity ?? 0);
      const tremaResult = r.tremaAudit?.result;
      const currentCalc = r.currentCalculation;

      const capA = Math.round(rawCapA > 0 ? rawCapA : (tremaResult?.recipientCapacityMonthly && tremaResult.recipientCapacityMonthly > 0 ? tremaResult.recipientCapacityMonthly : (currentCalc?.parentA_capacity || 0)));
      const capB = Math.round(rawCapB > 0 ? rawCapB : (tremaResult?.payerCapacityMonthly && tremaResult.payerCapacityMonthly > 0 ? tremaResult.payerCapacityMonthly : (currentCalc?.parentB_capacity || 0)));
      const stepparentCap = Math.round(Number(tremaResult?.stepparentCapacity || 0));
      const totalCapacity = Math.round(Number(r.totalCapacity || (capA + capB + stepparentCap)));

      const paymentA = Math.round(Number(pA.paymentTotal ?? pA.childAlimonyPayment ?? 0));
      const paymentB = Math.round(Number(pB.paymentTotal ?? pB.childAlimonyPayment ?? (currentCalc?.contribution && capB >= capA ? currentCalc.contribution : 0)));

      const payerName = paymentB >= paymentA ? nameB : nameA;
      const recipientName = payerName === nameB ? nameA : nameB;
      const payerAmount = Math.max(paymentA, paymentB);

      const isSufficient = totalCapacity >= totalNeed;
      const capacityDeficit = Math.round(Math.max(0, totalNeed - totalCapacity));

      const historicalNBGI = r.historicalCalculation?.historicalNBGI || cd.historicalNBGI || r.historicalCalculation?.fallbackNBGI || r.nbgi || 0;
      const historicalNeed = r.historicalCalculation?.historicalNeed || (totalNeed > 0 ? totalNeed : 0);
      const normYear = input.normVersion || r.normVersion || "2026.1";
      const calculationDate = cd.calculationDate || r.family?.calculationDate || new Date().toLocaleDateString("nl-NL");
      const historicalDate = cd.historicalPeriod?.calculationDate || "tijdstip samenleving/scheiding";

      // Colors
      const primaryColor = "#1e3a8a"; // Navy
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
      // PAGE 1: Header, Case Meta, Summary, Need & Distribution
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
      doc.text(`Dossier: ${input.caseName || input.clientName || "Alimentatiedossier"}`, 50, curY + 17, { width: 250, lineBreak: false });
      doc.text(`Ouder A: ${nameA}`, 50, curY + 28, { lineBreak: false });
      doc.text(`Ouder B: ${nameB}`, 50, curY + 39, { lineBreak: false });

      doc.fontSize(8).font("Helvetica-Bold").fillColor(darkColor).text("Normering & Status", 320, curY + 5, { lineBreak: false });
      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor);
      doc.text(`Tremanormen: ${normYear} (Rekenengine ${input.calculationVersion || "2.0.0"})`, 320, curY + 17, { lineBreak: false });
      doc.text(`Peildatum berekening: ${calculationDate}`, 320, curY + 28, { lineBreak: false });
      doc.text(`Opgesteld door: ${input.professionalName || input.practiceName || "Familierecht Specialist"}`, 320, curY + 39, { lineBreak: false });
      curY += 60;

      // SECTION 1: Samenvatting & Hoofdconclusie
      curY = drawSectionHeader("1. HOOFDCONCLUSIE EN BETAALVERPLICHTING", curY);
      doc.rect(40, curY, 515, 58).fill("#f8fafc").strokeColor(primaryColor).lineWidth(1).stroke();
      doc.fontSize(8).font("Helvetica").fillColor(darkColor);

      const capacityText = isSufficient
        ? `De totale gezamenlijke draagkracht van de ouders bedraagt ${euro(totalCapacity)} per maand en is toereikend om in de behoefte te voorzien.`
        : `De totale gezamenlijke draagkracht van de ouders (${euro(totalCapacity)}/mnd) is ontoereikend voor de volledige behoefte (tekort: ${euro(capacityDeficit)}/mnd). Conform Tremanormen dragen beide ouders ieder de helft van het tekort.`;

      doc.text(
        `Op basis van de Tremanormen ${normYear} bedraagt de totale behoefte van de ${childCount > 0 ? childCount : 1} minderjarige kind(eren) ` +
        `${euro(totalNeed)} per maand. ${capacityText}`,
        48,
        curY + 6,
        { width: 495 }
      );
      doc.fontSize(9.5).font("Helvetica-Bold").fillColor(primaryColor);
      doc.text(
        `Vastgestelde alimentatiebijdrage: ${euro(payerAmount)} per maand (te betalen door ${payerName} aan ${recipientName})`,
        48,
        curY + 28,
        { width: 495, lineBreak: false }
      );
      const perChildEst = childCount > 0 ? Math.round(payerAmount / childCount) : payerAmount;
      doc.fontSize(7.5).font("Helvetica").fillColor(mutedColor);
      doc.text(`(Gemiddeld ${euro(perChildEst)} per kind per maand, ingaande per peildatum ${calculationDate})`, 48, curY + 44, { lineBreak: false });
      curY += 64;

      // SECTION 2: Behoefteberekening kinderen
      curY = drawSectionHeader("2. BEHOEFTE VAN DE KINDEREN", curY);
      const historicalIncomes = r.historicalCalculation?.historicalIncomeSources || [];
      const histIncA = historicalIncomes[0]?.nbi || cd.parents?.[0]?.nbi || 0;
      const histIncB = historicalIncomes[1]?.nbi || cd.parents?.[1]?.nbi || 0;
      const histKgb = r.historicalCalculation?.historicalKGB || 0;

      if (historicalNBGI > 0) {
        if (histIncA > 0) curY = drawRow(`Netto inkomen ${nameA} (peildatum ${historicalDate})`, euro(histIncA), curY);
        if (histIncB > 0) curY = drawRow(`Netto inkomen ${nameB} (peildatum ${historicalDate})`, euro(histIncB), curY);
        if (histKgb > 0) curY = drawRow("Kindgebonden budget gezamenlijke huishouding", euro(histKgb), curY);
        curY = drawRow("Gezamenlijk Netto Gezinsinkomen (NBGI)", euro(historicalNBGI), curY, true);
        if (historicalNeed > 0 && historicalNeed !== totalNeed) {
          curY = drawRow(`Nibud-tabel basisbehoefte (${childCount > 0 ? childCount : 1} kind/kinderen)`, euro(historicalNeed), curY);
          curY = drawRow(`Wettelijke indexering naar normjaar ${normYear}`, euro(totalNeed), curY, true);
        } else {
          curY = drawRow(`Vastgestelde behoefte conform Trema-tabel (${normYear})`, euro(totalNeed), curY, true);
        }
      } else {
        curY = drawRow(`Vastgestelde totale behoefte der kinderen (${normYear})`, euro(totalNeed), curY, true);
      }
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
        doc.fontSize(8).font("Helvetica").fillColor(darkColor);
        doc.text("Minderjarig kind", 50, curY + 1, { lineBreak: false });
        doc.text("-", 170, curY + 1, { lineBreak: false });
        doc.text("Hoofdverblijf Ouder A", 250, curY + 1, { lineBreak: false });
        doc.text(euro(totalNeed), 350, curY + 1, { lineBreak: false });
        doc.font("Helvetica-Bold").text(euro(payerAmount), 450, curY + 1, { lineBreak: false });
        doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(40, curY + 12).lineTo(555, curY + 12).stroke();
        curY += 14;
      }

      // ==========================================
      // PAGE 2: Draagkracht, Vergelijking, Uitleg & Handtekeningen
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

      // Parent A extraction
      const nbiA = (pA.nbi && pA.nbi > 0) ? pA.nbi : (cd.parents?.[0]?.nbi && cd.parents?.[0]?.nbi > 0) ? cd.parents?.[0]?.nbi : (pA.income?.nbiMonthly || cd.parents?.[0]?.income?.netIncomeMonthly || currentCalc?.parentA_NBI || 0);
      const kgbA = pA.kgb ?? cd.parents?.[0]?.kgb ?? pA.income?.kgbMonthly ?? cd.parents?.[0]?.income?.kgbMonthly ?? currentCalc?.parentA_KGB ?? 0;
      const totalIncA = (pA.income?.nbiIncludingKgbMonthly && pA.income?.nbiIncludingKgbMonthly > 0) ? pA.income.nbiIncludingKgbMonthly : (nbiA + kgbA);
      const housingA = cd.parents?.[0]?.housingCosts ?? cd.parents?.[0]?.housing?.monthlyCosts ?? 0;
      const careDaysA = pA.careDaysPerWeek ?? cd.parents?.[0]?.careDaysPerWeek ?? 0;

      // Parent B extraction
      const nbiB = (pB.nbi && pB.nbi > 0) ? pB.nbi : (cd.parents?.[1]?.nbi && cd.parents?.[1]?.nbi > 0) ? cd.parents?.[1]?.nbi : (pB.income?.nbiMonthly || cd.parents?.[1]?.income?.netIncomeMonthly || currentCalc?.parentB_NBI || 0);
      const kgbB = pB.kgb ?? cd.parents?.[1]?.kgb ?? pB.income?.kgbMonthly ?? cd.parents?.[1]?.income?.kgbMonthly ?? currentCalc?.parentB_KGB ?? 0;
      const totalIncB = (pB.income?.nbiIncludingKgbMonthly && pB.income?.nbiIncludingKgbMonthly > 0) ? pB.income.nbiIncludingKgbMonthly : (nbiB + kgbB);
      const housingB = cd.parents?.[1]?.housingCosts ?? cd.parents?.[1]?.housing?.monthlyCosts ?? 0;
      const careDaysB = pB.careDaysPerWeek ?? cd.parents?.[1]?.careDaysPerWeek ?? 0;

      // Parent A Box
      doc.rect(40, curY, 252, 102).fill(lightBg).strokeColor(borderGray).stroke();
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(primaryColor).text(`Gegevens ${nameA}`, 48, curY + 5, { lineBreak: false });
      let subYA = curY + 18;
      const rowA = (lbl: string, val: string, bold = false) => {
        doc.fontSize(7.5).font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(bold ? darkColor : mutedColor).text(lbl, 48, subYA, { lineBreak: false });
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(darkColor).text(val, 210, subYA, { width: 76, align: "right", lineBreak: false });
        subYA += 12;
      };
      rowA("Netto inkomen (NBI):", euro(nbiA));
      rowA("Kindgebonden budget (KGB):", euro(kgbA));
      rowA("Totaal beschikbaar inkomen:", euro(totalIncA), true);
      rowA("Opgegeven woonlasten:", euro(housingA));
      rowA("Zorgdagen per week:", `${careDaysA} dag(en)`);
      rowA(`Draagkracht ${nameA}:`, euro(capA), true);
      rowA("Procentueel aandeel:", pA.sharePct ? `${pA.sharePct}%` : `${Math.round((capA / Math.max(1, totalCapacity)) * 100)}%`);

      // Parent B Box
      doc.rect(302, curY, 253, 102).fill(lightBg).strokeColor(borderGray).stroke();
      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(primaryColor).text(`Gegevens ${nameB}`, 310, curY + 5, { lineBreak: false });
      let subYB = curY + 18;
      const rowB = (lbl: string, val: string, bold = false) => {
        doc.fontSize(7.5).font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(bold ? darkColor : mutedColor).text(lbl, 310, subYB, { lineBreak: false });
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(darkColor).text(val, 470, subYB, { width: 78, align: "right", lineBreak: false });
        subYB += 12;
      };
      rowB("Netto inkomen (NBI):", euro(nbiB));
      rowB("Kindgebonden budget (KGB):", euro(kgbB));
      rowB("Totaal beschikbaar inkomen:", euro(totalIncB), true);
      rowB("Opgegeven woonlasten:", euro(housingB));
      rowB("Zorgdagen per week:", `${careDaysB} dag(en)`);
      rowB(`Draagkracht ${nameB}:`, euro(capB), true);
      rowB("Procentueel aandeel:", pB.sharePct ? `${pB.sharePct}%` : `${Math.round((capB / Math.max(1, totalCapacity)) * 100)}%`);

      curY += 109;

      // SECTION 5: Draagkrachtvergelijking & Zorgkorting
      curY = drawSectionHeader("5. DRAAGKRACHTVERGELIJKING EN VERDELING", curY);
      curY = drawRow("Totale gezamenlijke draagkracht van beide ouders:", euro(totalCapacity), curY, true);

      const payerParent = payerName === nameB ? pB : pA;
      const payerIdx = payerName === nameB ? 1 : 0;
      const payerCareDays = payerName === nameB ? careDaysB : careDaysA;
      const transferCareDiscount = Array.isArray(r.transfers)
        ? r.transfers.reduce((s: number, t: any) => s + ((t.payerIndex ?? (t.direction === "B->A" ? 1 : 0)) === payerIdx ? Number(t.careDiscount ?? t.appliedCareDiscount ?? 0) : 0), 0)
        : 0;
      const careDiscountPayer = Number(payerParent.totalCareDiscount || transferCareDiscount || r.careDiscount?.appliedCareDiscount || r.careDiscount?.total || 0);
      const rawCarePct = payerParent.careDiscountPctByChild?.[0];
      const careDiscountPct = (typeof rawCarePct === "number" && rawCarePct > 0)
        ? rawCarePct
        : (payerCareDays >= 3 ? 0.35 : payerCareDays >= 2 ? 0.25 : payerCareDays >= 1 ? 0.15 : 0);

      curY = drawRow(`Draagkracht ${nameA}:`, euro(capA), curY);
      curY = drawRow(`Draagkracht ${nameB}:`, euro(capB), curY);
      if (stepparentCap > 0) {
        const partnerParent = (cd.parents || []).find(
          (p: any) => p.newPartner?.present && (p.newPartner.relationship === 'MARRIED' || p.newPartner.relatievorm === 'MARRIED' || p.newPartner.relationship === 'REGISTERED_PARTNERSHIP')
        );
        const partnerName = partnerParent?.newPartner?.name || "Stiefouder";
        curY = drawRow(`Wettelijke stiefouderbijdrage art. 1:395 BW (${partnerName}):`, euro(stepparentCap), curY);
      }
      if (careDiscountPct > 0 || careDiscountPayer > 0) {
        curY = drawRow(`Zorgkortingspercentage ${payerName}:`, pct(careDiscountPct <= 1 ? careDiscountPct * 100 : careDiscountPct), curY);
        curY = drawRow(`Toegepaste zorgkorting:`, `${euro(careDiscountPayer)} per maand`, curY);
      }
      if (!isSufficient) {
        curY = drawRow("Tekort gezamenlijke draagkracht:", `${euro(capacityDeficit)} per maand`, curY, false);
      }
      curY = drawRow(`Vastgestelde alimentatieverplichting door ${payerName}:`, `${euro(payerAmount)} per maand`, curY, true);

      // Partneralimentatie (indien aanwezig)
      const partnerSupportGross = Number(
        r.combined?.partnerSupport?.monthlyGross ??
        r.partnerSupport?.result?.monthlyGross ??
        r.partnerSupport?.monthlyGross ??
        r.partnerSupport?.payment ??
        0
      );
      const partnerSupportNet = Number(
        r.combined?.partnerSupport?.monthlyNet ??
        r.partnerSupport?.result?.monthlyNet ??
        r.partnerSupport?.monthlyNet ??
        0
      );
      if (partnerSupportGross > 0) {
        curY += 2;
        const palDisplay = partnerSupportNet > 0
          ? `${euro(partnerSupportGross)} bruto/mnd (${euro(partnerSupportNet)} netto)`
          : `${euro(partnerSupportGross)} per maand`;
        curY = drawRow("Aanvullende partneralimentatie:", palDisplay, curY, true);
      }
      curY += 4;

      // SECTION 6: Juridische toelichting & Uitleg voor ouders
      curY = drawSectionHeader("6. JURIDISCHE ONDERBOUWING & TOELICHTING", curY);
      doc.fontSize(7.5).font("Helvetica").fillColor(darkColor);
      const paragraphs = [
        "1. Behoeftebepaling: De behoefte van de kinderen is vastgesteld conform de officiële tabel 'Kosten van kinderen' van het Nibud, behorende bij de Tremanormen (Expertgroep Alimentatienormen). Indien van toepassing is deze behoefte geïndexeerd met de wettelijke indexeringspercentages.",
        "2. Draagkrachtverdeling: Bij een toereikende gezamenlijke draagkracht wordt de behoefte tussen de ouders verdeeld naar rato van ieders draagkracht. Wanneer de gezamenlijke draagkracht onvoldoende is, dragen beide ouders gelijkwaardig bij in het tekort en wordt de zorgkorting slechts toegepast voor zover de draagkracht dit toelaat.",
        `3. Zorgkorting: De zorgkorting compenseert de verblijfskosten tijdens de omgangsregeling/zorgverdeling (${payerName}: ${payerName === nameB ? careDaysB : careDaysA} zorgdag(en)/week).`,
        stepparentCap > 0 ? "4. Stiefouder-onderhoudsplicht (art. 1:395 BW jo. 1:404 BW): Door het huwelijk of geregistreerd partnerschap is de ouder van rechtswege onderhoudsplichtig voor de tot het gezin behorende minderjarige stiefkinderen. Conform de Tremanormen en vaste rechtspraak van de Hoge Raad (HR 9 maart 2018) staan eigen kinderen en stiefkinderen in gelijke rangorde en wordt de beschikbare draagkracht pro-rata verdeeld over alle kinderen." : null,
        `${stepparentCap > 0 ? "5" : "4"}. Rechtsgeldigheid: Deze berekening voldoet aan de wettelijke maatstaven van artikel 1:392 e.v. en 1:404 van het Burgerlijk Wetboek en is geschikt voor het echtscheidingsconvenant, ouderschapsplan of indiening bij de rechtbank. Wijziging van omstandigheden kan aanleiding geven tot herberekening.`,
      ].filter(Boolean) as string[];
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
      doc.text(`Datum: ____ - ____ - ${new Date().getFullYear()}`, 45, curY + 28, { lineBreak: false });

      doc.text(`Handtekening ${nameB}:`, 320, curY, { lineBreak: false });
      doc.text("_____________________________________", 320, curY + 14, { lineBreak: false });
      doc.text(`Datum: ____ - ____ - ${new Date().getFullYear()}`, 320, curY + 28, { lineBreak: false });

      // Footer numbering across all pages
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.page.margins.bottom = 0;
        doc.fontSize(7.5).font("Helvetica").fillColor("#94a3b8");
        doc.text(
          `Alimentatieberekening conform Tremanormen ${normYear} • Dossier: ${input.caseName || input.clientName || "Dossier"} • Pagina ${i + 1} van ${totalPages}`,
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
