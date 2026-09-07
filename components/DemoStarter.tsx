"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DemoStarter() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startDemo() {
    setBusy(true);
    setError("");
    try {
      const clientResponse = await fetch("/api/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Demo cliënt — fictief",
          reference: `DEMO-${Date.now()}`,
          notes: "Volledig fictieve demo-data. Niet gebruiken voor een echte berekening.",
          personAName: "Thomas de Vries",
          personBName: "Sophie de Vries",
        }),
      });
      if (!clientResponse.ok) throw new Error(await clientResponse.text());
      const client = await clientResponse.json();

      const data = {
        relationship: "MARRIED",
        historicalNBGI: 5600,
        parents: [
          {
            name: "Thomas de Vries", nbi: 4000, kgb: 0, aow: false, housingCosts: 1250,
            housing: { type: "RENT", monthlyCosts: 1250 }, specialNecessaryCosts: 0, otherMaintenance: 0,
            careDaysPerWeek: 2, receivesBijstand: false,
            income: { mode: "NBI", netIncomeMonthly: 4000 },
            newPartner: { present: true, name: "Laura Jansen", relationship: "COHABITING", nbiMonthly: 2200, selfSupporting: true, children: [] },
          },
          {
            name: "Sophie de Vries", nbi: 2400, kgb: 350, aow: false, housingCosts: 1050,
            housing: { type: "RENT", monthlyCosts: 1050 }, specialNecessaryCosts: 0, otherMaintenance: 0,
            careDaysPerWeek: 5, receivesBijstand: false,
            income: { mode: "NBI", netIncomeMonthly: 2400 },
            newPartner: { present: false, name: "", relationship: "NONE", nbiMonthly: 0, selfSupporting: true, children: [] },
          },
        ],
        children: [
          { name: "Emma de Vries", age: 8, residence: "B", specialCosts: 0, ownIncome: 0, studentType: "OTHER", livesAtHome: true },
          { name: "Lucas de Vries", age: 5, residence: "B", specialCosts: 0, ownIncome: 0, studentType: "OTHER", livesAtHome: true },
        ],
        actualKgbReceivingParent: 350,
        partnerSupport: {
          enabled: true,
          payerIndex: 0,
          useHofnorm: true,
          historicalNBGI: 5600,
          historicalChildCosts: 1050,
          concreteNeedNet: 0,
          recipientVerdiencapaciteit: 0,
          recipientOtherIncomeMonthly: 0,
          recipientAssetsIncomeMonthly: 0,
          payerOtherMaintenanceObligations: 0,
          payerPensionProvisionMonthly: 0,
          payerTaxableIncomeAnnual: 48000,
          incomeComparisonEnabled: false,
          durationException: "NONE",
        },
      };

      const caseResponse = await fetch("/api/cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "DEMO — Voorbeeldgezin",
          clientId: client.id,
          data,
          meta: {
            effectiveDate: new Date().toISOString().slice(0, 10),
            separationDate: "2025-01-01",
            notes: "Fictieve demo-data. Niet juridisch gebruiken.",
          },
        }),
      });
      if (!caseResponse.ok) throw new Error(await caseResponse.text());
      const created = await caseResponse.json();
      router.push(`/cases/${created.id}/workflow`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo starten mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return <div>
    <button type="button" className="quick-card" onClick={startDemo} disabled={busy} style={{ width: "100%", textAlign: "left", border: 0, font: "inherit", cursor: busy ? "wait" : "pointer" }}>
      <b>{busy ? "Demo wordt opgebouwd…" : "▶ Start volledige demo"}</b>
      <span>Laad een fictief gezin met ouders, kinderen, wonen, nieuwe partner, kinderalimentatie en partneralimentatie. Daarna ga je direct naar de workflow.</span>
    </button>
    {error && <div className="notice error topgap">{error}</div>}
  </div>;
}
