'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const money = (value: unknown) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(Number(value) || 0);
const numberValue = (value: string) => Math.max(0, Number(String(value).replace(',', '.')) || 0);

type Form = Record<string, any>;
type CareObligation = { id: string; description: string; monthlyAmount: string; included: boolean };

const initial: Form = {
  historicalNBGI: '', historicalChildCosts: '', currentChildSupport: '0', currentRecipientNBI: '', currentPayerNBI: '',
  payerTaxableIncomeAnnual: '', recipientVerdiencapaciteit: '0', recipientOtherIncomeMonthly: '0', recipientAssetsIncomeMonthly: '0',
  payerAssetsIncomeMonthly: '0', payerHousingCosts: '0', payerMortgageInterestTaxBenefitMonthly: '0', payerOtherNecessaryCosts: '0',
  payerOtherMaintenanceObligations: '0', payerPensionProvisionMonthly: '0', payerCapacityAdjustment: '0', payerBusinessProfitAnnual: '0',
  payerBusinessProfitYears: '', payerDividendAnnual: '0', payerBox3IncomeAnnual: '0', payerVariableIncomeYears: '',
  recipientBusinessProfitAnnual: '0', recipientBusinessProfitYears: '', recipientDividendAnnual: '0', recipientBox3IncomeAnnual: '0',
  payerIsFamily: false, payerOwnHome: false, historicalDate: '', effectiveDate: new Date().toISOString().slice(0, 10),
  useHofnorm: true, concreteNeedNet: '0', incomeComparisonEnabled: false, durationException: 'NONE',
  partnerCapacityMode: 'CALCULATE', partnerNetMonthlyIncome: '', partnerBasicNeedMonthly: '', partnerOtherObligationsMonthly: '',
  partnerAllocationPercentage: '100',
};

function anonymize(value: unknown, key = ''): unknown {
  if (value === null || value === undefined || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (/(name|naam|email|phone|address|straat|postcode|id|uuid|token|secret)/i.test(key)) return '[verwijderd]';
    return value.replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[verwijderd e-mailadres]').replace(/\b(?:\+?31|0)\s?[1-9](?:[\s.-]?\d){8}\b/g, '[verwijderd telefoonnummer]');
  }
  if (Array.isArray(value)) return value.map((item) => anonymize(item, key));
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([k]) => !/(password|secret|token|session|ip|uuid)/i.test(k)).map(([k, v]) => [k, anonymize(v, k)]));
  return '[verwijderd]';
}

export default function PartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');
  const [form, setForm] = useState<Form>(initial);
  const [obligations, setObligations] = useState<CareObligation[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { params.then((p) => { setId(p.id); }); }, [params]);
  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const years = (value: string) => value.split(/[,;\s]+/).filter(Boolean).map(Number).filter(Number.isFinite);
  const partnerObligationPayload = useMemo(() => obligations.map((item) => ({ id: item.id, description: item.description, monthlyAmount: numberValue(item.monthlyAmount), included: item.included })), [obligations]);

  async function calculate() {
    setBusy(true); setError('');
    try {
      const body = {
        ...form,
        historicalNBGI: numberValue(form.historicalNBGI), historicalChildCosts: numberValue(form.historicalChildCosts), currentChildSupport: numberValue(form.currentChildSupport),
        currentRecipientNBI: numberValue(form.currentRecipientNBI), currentPayerNBI: numberValue(form.currentPayerNBI), payerTaxableIncomeAnnual: numberValue(form.payerTaxableIncomeAnnual),
        recipientVerdiencapaciteit: numberValue(form.recipientVerdiencapaciteit), recipientOtherIncomeMonthly: numberValue(form.recipientOtherIncomeMonthly), recipientAssetsIncomeMonthly: numberValue(form.recipientAssetsIncomeMonthly),
        payerAssetsIncomeMonthly: numberValue(form.payerAssetsIncomeMonthly), payerHousingCosts: numberValue(form.payerHousingCosts), payerMortgageInterestTaxBenefitMonthly: numberValue(form.payerMortgageInterestTaxBenefitMonthly),
        payerOtherNecessaryCosts: numberValue(form.payerOtherNecessaryCosts), payerOtherMaintenanceObligations: numberValue(form.payerOtherMaintenanceObligations), payerPensionProvisionMonthly: numberValue(form.payerPensionProvisionMonthly), payerCapacityAdjustment: numberValue(form.payerCapacityAdjustment),
        payerBusinessProfitAnnual: numberValue(form.payerBusinessProfitAnnual), payerBusinessProfitYears: years(form.payerBusinessProfitYears), payerDividendAnnual: numberValue(form.payerDividendAnnual), payerBox3IncomeAnnual: numberValue(form.payerBox3IncomeAnnual), payerVariableIncomeYears: years(form.payerVariableIncomeYears),
        recipientBusinessProfitAnnual: numberValue(form.recipientBusinessProfitAnnual), recipientBusinessProfitYears: years(form.recipientBusinessProfitYears), recipientDividendAnnual: numberValue(form.recipientDividendAnnual), recipientBox3IncomeAnnual: numberValue(form.recipientBox3IncomeAnnual), concreteNeedNet: numberValue(form.concreteNeedNet),
        partnerNetMonthlyIncome: numberValue(form.partnerNetMonthlyIncome), partnerBasicNeedMonthly: numberValue(form.partnerBasicNeedMonthly), partnerOtherObligationsMonthly: numberValue(form.partnerOtherObligationsMonthly), partnerAllocationPercentage: numberValue(form.partnerAllocationPercentage), partnerCareObligations: partnerObligationPayload,
      };
      const response = await fetch(`/api/cases/${id}/partneralimentatie`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(await response.text());
      setResult(await response.json());
    } catch (e: any) { setError(e?.message || 'Berekening mislukt.'); } finally { setBusy(false); }
  }

  function downloadAnonymized() {
    if (!result) return;
    const payload = { title: 'GEANONIMISEERDE ALIMENTATIEBEREKENING', notice: 'Geanonimiseerd — uitsluitend voor controle en ontwikkeling', generatedAt: new Date().toISOString(), input: anonymize(form), careObligations: anonymize(partnerObligationPayload), calculation: anonymize(result), disclaimer: 'Niet gebruiken als juridisch advies of definitieve vaststelling.' };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `geanonimiseerde-alimentatieberekening-${id}.json`; anchor.click(); URL.revokeObjectURL(url);
  }

  const Field = ({ label, name, help }: { label: string; name: string; help?: string }) => <div><label className="label" htmlFor={name}>{label}</label><input id={name} className="input" value={form[name] ?? ''} onChange={(event) => set(name, event.target.value)} />{help && <div className="panel-sub">{help}</div>}</div>;

  return <main className="content" style={{ maxWidth: 1220 }}>
    <div className="page-head"><div><div className="eyebrow">Partneralimentatie · professionele analyse</div><h1 className="page-title">Complexe partneralimentatie</h1><p className="page-subtitle">Een transparante berekening met afzonderlijke draagkracht, verplichtingen, uitleg en controleerbare uitgangspunten.</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link></div></div>

    <section className="panel"><div className="panel-head"><div><h2 className="panel-title">1. Historische behoefte</h2><div className="panel-sub">De historische behoefte vormt het uitgangspunt. Gebruik de hofnorm alleen wanneer die passend en onderbouwd is.</div></div></div><div className="form-grid topgap"><Field label="Historisch NBGI per maand" name="historicalNBGI"/><Field label="Kosten kinderen per maand" name="historicalChildCosts"/><Field label="Datum historisch NBGI" name="historicalDate"/><Field label="Ingangsdatum" name="effectiveDate"/><div className="full"><label className="label"><input type="checkbox" checked={form.useHofnorm} onChange={(e) => set('useHofnorm', e.target.checked)} /> Hofnorm gebruiken (60%)</label></div>{!form.useHofnorm && <Field label="Concrete netto behoefte per maand" name="concreteNeedNet"/>}</div></section>

    <div className="two-col topgap"><section className="panel"><h2 className="panel-title">2. Ontvanger</h2><div className="panel-sub">Vul de actuele inkomsten en verdiencapaciteit afzonderlijk in.</div><div className="form-grid topgap"><Field label="Huidig NBI per maand" name="currentRecipientNBI"/><Field label="Verdiencapaciteit per maand" name="recipientVerdiencapaciteit"/><Field label="Overig inkomen per maand" name="recipientOtherIncomeMonthly"/><Field label="Inkomen uit vermogen per maand" name="recipientAssetsIncomeMonthly"/><Field label="Winst onderneming per jaar" name="recipientBusinessProfitAnnual"/><Field label="Winst eerdere jaren" name="recipientBusinessProfitYears" help="Bedragen gescheiden door spaties of komma's."/><Field label="Dividend per jaar" name="recipientDividendAnnual"/><Field label="Box 3-inkomen per jaar" name="recipientBox3IncomeAnnual"/></div></section><section className="panel"><h2 className="panel-title">3. Betaler & draagkracht</h2><div className="panel-sub">Kinderalimentatie en noodzakelijke lasten worden vóór partneralimentatie meegenomen.</div><div className="form-grid topgap"><Field label="Huidig NBI per maand" name="currentPayerNBI"/><Field label="Belastbaar inkomen per jaar" name="payerTaxableIncomeAnnual"/><Field label="Woonlast per maand" name="payerHousingCosts"/><Field label="Fiscaal hypotheekvoordeel per maand" name="payerMortgageInterestTaxBenefitMonthly"/><Field label="Noodzakelijke lasten per maand" name="payerOtherNecessaryCosts"/><Field label="Pensioen/lijfrente per maand" name="payerPensionProvisionMonthly"/><Field label="Andere onderhoudsverplichtingen per maand" name="payerOtherMaintenanceObligations"/><Field label="Correctie draagkracht per maand" name="payerCapacityAdjustment"/></div></section></div>

    <section className="panel topgap"><h2 className="panel-title">4. Nieuwe partner: draagkracht en zorgverplichtingen</h2><p className="panel-sub">De nieuwe partner wordt afzonderlijk beoordeeld. Ontbrekende inkomsten betekenen niet automatisch 0 draagkracht; kies dat scenario expliciet als het van toepassing is.</p><div className="form-grid topgap"><div><label className="label" htmlFor="partnerCapacityMode">Draagkrachtmodus</label><select id="partnerCapacityMode" className="input" value={form.partnerCapacityMode} onChange={(e) => set('partnerCapacityMode', e.target.value)}><option value="CALCULATE">Draagkracht berekenen</option><option value="ZERO_CAPACITY">Nieuwe partner heeft 0 draagkracht</option></select></div><Field label="Netto inkomen nieuwe partner p/m" name="partnerNetMonthlyIncome"/><Field label="Basisbehoefte nieuwe partner p/m" name="partnerBasicNeedMonthly"/><Field label="Overige verplichtingen nieuwe partner p/m" name="partnerOtherObligationsMonthly"/><Field label="Toerekening beschikbare draagkracht (%)" name="partnerAllocationPercentage" help="Gebruik 0% wanneer niets aan de analyse wordt toegerekend."/></div><div className="notice topgap">Zorgverplichtingen voor kinderen van de nieuwe partner worden eerst van de beschikbare partnercapaciteit afgetrokken. Het niet-opgevangen deel wordt toegevoegd aan de onderhoudsverplichtingen van de andere persoon. Dit voorkomt dat een tekort verdwijnt uit de berekening.</div><div className="panel-head topgap"><div><h3 className="panel-title">Kinderen van de nieuwe partner</h3><div className="panel-sub">Voeg per kind de onderbouwde maandelijkse zorgverplichting toe.</div></div><button className="btn secondary" type="button" onClick={() => setObligations((items) => [...items, { id: `child-${items.length + 1}`, description: '', monthlyAmount: '', included: true }])}>+ Kind toevoegen</button></div>{obligations.length === 0 && <div className="panel-sub topgap">Nog geen zorgverplichtingen toegevoegd.</div>}{obligations.map((item, index) => <div className="obligation-row topgap" key={item.id}><div><label className="label">Omschrijving kind {index + 1}</label><input className="input" value={item.description} onChange={(e) => setObligations((items) => items.map((x) => x.id === item.id ? { ...x, description: e.target.value } : x))}/></div><div><label className="label">Bedrag per maand</label><input className="input" value={item.monthlyAmount} onChange={(e) => setObligations((items) => items.map((x) => x.id === item.id ? { ...x, monthlyAmount: e.target.value } : x))}/></div><label className="label"><input type="checkbox" checked={item.included} onChange={(e) => setObligations((items) => items.map((x) => x.id === item.id ? { ...x, included: e.target.checked } : x))}/> Meenemen</label><button className="btn danger" type="button" onClick={() => setObligations((items) => items.filter((x) => x.id !== item.id))}>Verwijder</button></div>)}</section>

    <section className="panel topgap"><h2 className="panel-title">5. Overige uitgangspunten</h2><div className="form-grid topgap"><Field label="Kinderalimentatie per maand" name="currentChildSupport"/><Field label="Overig vermogen betaler per maand" name="payerAssetsIncomeMonthly"/><Field label="Ondernemingswinst betaler per jaar" name="payerBusinessProfitAnnual"/><Field label="Dividend betaler per jaar" name="payerDividendAnnual"/><Field label="Box 3-inkomen betaler per jaar" name="payerBox3IncomeAnnual"/><Field label="Variabel inkomen eerdere jaren" name="payerVariableIncomeYears"/><div><label className="label">Duurregel</label><select className="input" value={form.durationException} onChange={(e) => set('durationException', e.target.value)}><option value="NONE">Hoofdregel</option><option value="CHILD_YOUNGER_THAN_12">Jongste kind jonger dan 12</option><option value="LONG_MARRIAGE_PRE_1970">Overgangsregel lang huwelijk</option><option value="RECEIVER_BORN_1970_OR_EARLIER">Overgangsregel geboortejaar</option><option value="AGREEMENT_OR_COURT">Afspraak of rechter bepaalt duur</option></select></div></div><button className="btn topgap" disabled={busy} onClick={calculate}>{busy ? 'Berekenen…' : 'Bereken partneralimentatie'}</button>{error && <div className="notice error topgap">{error}</div>}</section>

    {result && <section className="panel topgap"><div className="result-hero"><div className="stat-card result-main"><div className="stat-label">BRUTO PARTNERALIMENTATIE</div><div className="stat-value">{money(result.result?.monthlyGross)}</div><div className="stat-meta">Netto: {money(result.result?.monthlyNet)} per maand · begrenzing: {result.result?.limitedBy || '—'}</div></div><div className="stat-card"><div className="stat-label">AANVULLENDE BEHOEFTE</div><div className="stat-value">{money(result.need?.additionalNeedNet)}</div></div><div className="stat-card"><div className="stat-label">RESTERENDE DRAAGKRACHT</div><div className="stat-value">{money(result.capacity?.remainingNet)}</div></div></div>{result.partnerCapacity && <div className="partner-result topgap"><h2 className="panel-title">Nieuwe-partneranalyse</h2><div className="summary-line"><span>Beschikbare draagkracht nieuwe partner</span><b>{money(result.partnerCapacity.availableCapacityMonthly)}</b></div><div className="summary-line"><span>Toegerekende draagkracht nieuwe partner</span><b>{money(result.partnerCapacity.allocatedCapacityMonthly)}</b></div><div className="summary-line"><span>Niet-opgevangen zorgverplichtingen voor kinderen van de nieuwe partner</span><b>{money(result.partnerCapacity.uncoveredCareObligationsAllocatedToOtherPerson)}</b></div><div className="explanation-list">{result.partnerCapacity.explanation?.map((line: string, index: number) => <p key={index}>{line}</p>)}</div></div>}<div className="two-col topgap"><div><h2 className="panel-title">Volledige rekenroute</h2>{result.steps?.map((step: any) => <div className="summary-line" key={step.step}><span>{step.step}. {step.title}<small>{step.formula}</small></span><b>{money(step.value)}</b></div>)}</div><div><h2 className="panel-title">Inkomensanalyse</h2>{Object.entries(result.incomeAnalysis || {}).map(([key, value]: any) => <div className="summary-line" key={key}><span>{key}</span><b>{money(value)}</b></div>)}{result.warnings?.map((warning: string, index: number) => <div className="notice topgap" key={index}>• {warning}</div>)}</div></div><div className="notice topgap">{result.disclaimer}</div><div className="actions topgap"><button className="btn secondary" type="button" onClick={downloadAnonymized}>Download geanonimiseerde berekening</button><span className="panel-sub">De normale berekening blijft volledig herkenbaar. Alleen deze download wordt geanonimiseerd.</span></div></section>}
  </main>;
}
