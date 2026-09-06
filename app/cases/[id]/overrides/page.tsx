import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
const json=(v:any)=>JSON.stringify(v);
export default async function OverridesPage({params}:{params:Promise<{id:string}>}){
 const u=await requireUser(); const {id}=await params;
 const c=await db.case.findFirst({where:{id,userId:u.id},include:{overrides:{orderBy:{createdAt:'desc'}}}});
 if(!c)return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;
 return <AppShell><div className="page-head"><div><div className="eyebrow">Professionele overrides · v1.3.1</div><h1 className="page-title">{c.name}</h1><p className="page-subtitle">Een override wijzigt de bronberekening niet. De afwijking wordt expliciet, onderbouwd en geaudit vastgelegd.</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link><Link className="btn secondary" href={`/cases/${id}/review`}>Case Review</Link></div></div>
 <div className="notice">Principe: <b>engine-uitkomst → professionele afwijking → reden → audit trail</b>. Gebruik alleen een override wanneer de professionele onderbouwing in het dossier aanwezig is.</div>
 <section className="panel topgap"><h2 className="panel-title">Nieuwe override</h2><form className="topgap" action={`/api/cases/${id}/overrides`} method="post"><label className="field"><span>Veld / resultaatonderdeel</span><input name="field" placeholder="bijv. partner.result.monthlyNet" required /></label><label className="field"><span>Nieuwe waarde</span><input name="overrideValue" placeholder="bijv. 700" required /></label><label className="field"><span>Professionele onderbouwing</span><textarea name="reason" minLength={10} maxLength={4000} rows={5} required placeholder="Leg vast waarom van de engine-uitkomst wordt afgeweken."></textarea></label><button className="btn" type="submit">Override opslaan</button></form><p className="subtle topgap">Let op: de API verwacht JSON. Gebruik voor integraties POST met <code>{json({field:'partner.result.monthlyNet',overrideValue:700,reason:'Onderbouwde afwijking op basis van dossierstukken en professionele beoordeling.'})}</code>.</p></section>
 <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Audit trail</h2><div className="panel-sub">{c.overrides.length} vastgelegde afwijkingen.</div></div></div>{c.overrides.length===0?<div className="empty">Nog geen overrides.</div>:c.overrides.map(o=><div className="quick-card" key={o.id}><div className="summary-line"><b>{o.field}</b><span>{new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium',timeStyle:'short'}).format(o.createdAt)}</span></div><div className="subtle topgap">Enginewaarde: {JSON.stringify(o.originalValue)} → professioneel: {JSON.stringify(o.overrideValue)}</div><div className="topgap">{o.reason}</div></div>)}</section>
 </AppShell>
}
