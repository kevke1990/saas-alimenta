import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildCalculationDifference } from '@/lib/calculation-difference';

const money=(v:any)=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(v)||0);
const date=(v:any)=>new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));

export default async function CalculationComparePage({params}:{params:Promise<{id:string;fromId:string;toId:string}>}){
 const u=await requireUser(); const {id,fromId,toId}=await params;
 const c=await db.case.findFirst({where:{id,userId:u.id},include:{calculations:{where:{id:{in:[fromId,toId]}},take:2}}});
 if(!c)return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;
 const from=c.calculations.find((x:any)=>x.id===fromId); const to=c.calculations.find((x:any)=>x.id===toId);
 if(!from||!to)return <AppShell><div className="notice error">Een van de berekeningssnapshots is niet gevonden.</div></AppShell>;
 const fr:any=from.result||{}, tr:any=to.result||{};
 const difference=buildCalculationDifference({previous:{inputSnapshot:from.inputSnapshot,result:from.result,fingerprint:fr.calculationFingerprint||null},current:{inputSnapshot:to.inputSnapshot,result:to.result,fingerprint:tr.calculationFingerprint||null}});
 const label=(n:number)=>n>0?`+${money(n)}`:money(n);
 return <AppShell><main className="content" style={{maxWidth:1200}}>
  <div className="page-head"><div><div className="eyebrow">Dossier · berekeningsverschil</div><h1 className="page-title">Vergelijk twee berekeningen</h1><p className="page-subtitle">{date(from.createdAt)} → {date(to.createdAt)}. Alleen-lezen vergelijking van snapshots.</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}/history`}>← Historie</Link><Link className="btn" href={`/cases/${id}/history/${to.id}`}>Snapshot bekijken</Link></div></div>
  <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Financieel verschil per maand</h2><div className="panel-sub">Een positief bedrag betekent een hogere uitkomst in de nieuwe snapshot.</div></div></div>
   <div className="result-overview"><div className="result-metric"><div className="stat-label">KINDERALIMENTATIE</div><div className="metric-value">{label(difference.delta.childSupport)}</div><span>verschil per maand</span></div><div className="result-metric"><div className="stat-label">PAL NETTO</div><div className="metric-value">{label(difference.delta.partnerSupportNet)}</div><span>verschil per maand</span></div><div className="result-metric"><div className="stat-label">PAL BRUTO</div><div className="metric-value">{label(difference.delta.partnerSupportGross)}</div><span>verschil per maand</span></div><div className="result-metric"><div className="stat-label">TOTAAL</div><div className="metric-value">{label(difference.delta.totalPayments)}</div><span>verschil per maand</span></div></div>
  </section>
  <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Nieuwe uitkomst</h2><div className="panel-sub">Actuele bedragen uit de geselecteerde snapshot.</div></div></div><div className="detail-grid"><div className="detail-card"><div className="summary-line"><span>Kinderenalimentatie</span><b>{money(difference.monthly.childSupport)}</b></div><div className="summary-line"><span>Partneralimentatie netto</span><b>{money(difference.monthly.partnerSupportNet)}</b></div></div><div className="detail-card"><div className="summary-line"><span>Partneralimentatie bruto</span><b>{money(difference.monthly.partnerSupportGross)}</b></div><div className="summary-line"><span>Totale maandbetaling</span><b>{money(difference.monthly.totalPayments)}</b></div></div></div></section>
  <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Gewijzigde invoer</h2><div className="panel-sub">Alle verschillen in de opgeslagen invoersnapshot worden expliciet getoond.</div></div></div>
   {difference.inputChanges.length===0?<div className="notice">Geen invoerwijzigingen gevonden.</div>:<div className="table-wrap"><table className="table"><thead><tr><th>Veld</th><th>Oud</th><th>Nieuw</th></tr></thead><tbody>{difference.inputChanges.map((change:any,i:number)=><tr key={`${change.path}-${i}`}><td><b>{change.path}</b></td><td>{String(change.previous??'—')}</td><td>{String(change.current??'—')}</td></tr>)}</tbody></table></div>}
  </section>
  <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Snapshot-identiteit</h2></div></div><div className="detail-grid"><div className="detail-card"><div className="summary-line"><span>Oude snapshot</span><b>{from.id}</b></div><div className="summary-line"><span>Engine / norm</span><b>{from.engineVersion} / {from.normVersion}</b></div></div><div className="detail-card"><div className="summary-line"><span>Nieuwe snapshot</span><b>{to.id}</b></div><div className="summary-line"><span>Engine / norm</span><b>{to.engineVersion} / {to.normVersion}</b></div></div></div><div className="notice topgap">Fingerprints: <b>{difference.previousFingerprint||'niet opgeslagen'}</b> → <b>{difference.currentFingerprint||'niet opgeslagen'}</b>. Snapshots blijven immutable.</div></section>
 </main></AppShell>;
}
