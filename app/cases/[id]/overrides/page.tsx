import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

const money=(v:any)=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(v)||0);
const date=(v:any)=>new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));
const fieldLabels:Record<string,string>={
 'combined.childSupportTotal':'Totale kinderalimentatie',
 'combined.partnerSupport.monthlyNet':'Partneralimentatie netto',
 'combined.partnerSupport.monthlyGross':'Partneralimentatie bruto',
 'combined.totalMonthlyPayments':'Totale maandelijkse betalingen',
};
const statusLabels:Record<string,string>={INCOMPLETE:'Incompleet',READY_FOR_REVIEW:'Klaar voor review',REVIEWED:'Beoordeeld',APPROVED:'Goedgekeurd',FINAL:'Definitief'};
const formatVal=(v:any)=>typeof v==='number'||(!isNaN(Number(v))&&v!==null&&v!=='')?money(Number(v)):String(v??'—');

export default async function OverridesPage({params}:{params:Promise<{id:string}>}){
 const u=await requireUser(); const {id}=await params;
 const c=await db.case.findFirst({where:{id,userId:u.id},include:{overrides:{orderBy:{createdAt:'desc'}} ,calculations:{orderBy:{createdAt:'desc'},take:1}}});
 if(!c)return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;
 const result:any=c.result||{};
 const options=[['combined.childSupportTotal','Totale kinderalimentatie',result.combined?.childSupportTotal],['combined.partnerSupport.monthlyNet','PAL netto',result.combined?.partnerSupport?.monthlyNet],['combined.partnerSupport.monthlyGross','PAL bruto',result.combined?.partnerSupport?.monthlyGross],['combined.totalMonthlyPayments','Totale maandelijkse betalingen',result.combined?.totalMonthlyPayments]] as const;
 const locked=c.reviewStatus==='APPROVED'||c.reviewStatus==='FINAL';
 return <AppShell><div className="page-head"><div><div className="eyebrow">Professionele afwijkingen · gecontroleerde snapshots</div><h1 className="page-title">{c.name}</h1><p className="page-subtitle">Een professionele afwijking maakt een nieuwe berekeningssnapshot. De oorspronkelijke engine-snapshot blijft ongewijzigd bewaard.</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link><Link className="btn secondary" href={`/cases/${id}/review`}>Reviewcentrum</Link></div></div>
 <div className="notice">Principe: <b>engine-uitkomst → professionele afwijking → motivering → nieuwe snapshot → nieuwe review</b>. Goedgekeurde en definitieve dossiers zijn vergrendeld.</div>
 {locked&&<div className="notice error topgap">Dit dossier heeft de status <b>{statusLabels[c.reviewStatus]||c.reviewStatus}</b>. Heropen eerst de review voordat een professionele afwijking kan worden vastgelegd.</div>}
 <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Resultaatonderdelen</h2><div className="panel-sub">Alleen gecontroleerde resultaatvelden kunnen direct worden aangepast.</div></div></div><div className="detail-grid topgap">{options.map(([field,label,value])=><form className="detail-card" action={`/api/cases/${id}/overrides`} method="post" key={field}><input type="hidden" name="field" value={field}/><div className="detail-card-head"><b>{label}</b><span>Engine: {money(value)}</span></div><label className="field topgap"><span className="label">Professionele waarde</span><input className="input" name="overrideValue" type="number" step="0.01" defaultValue={Number(value)||0} required disabled={locked}/></label><label className="field topgap"><span className="label">Onderbouwing</span><textarea className="input" name="reason" minLength={10} maxLength={4000} rows={4} required disabled={locked} placeholder="Onderbouw de afwijking met de relevante dossierstukken en professionele beoordeling."/></label><button className="btn topgap" type="submit" disabled={locked}>Opslaan & nieuwe snapshot</button></form>)}</div></section>
 <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Audittrail afwijkingen</h2><div className="panel-sub">{c.overrides.length} vastgelegde professionele afwijkingen.</div></div></div>{c.overrides.length===0?<div className="empty">Nog geen professionele afwijkingen vastgelegd.</div>:<div className="stack topgap">{c.overrides.map(o=><div className="quick-card" key={o.id}><div className="summary-line"><b>{fieldLabels[o.field]||o.field}</b><span>{date(o.createdAt)}</span></div><div className="subtle topgap">Enginewaarde: <b>{formatVal(o.originalValue)}</b> → Professionele waarde: <b>{formatVal(o.overrideValue)}</b></div><div className="topgap">{o.reason}</div></div>)}</div>}</section>
 </AppShell>
}
