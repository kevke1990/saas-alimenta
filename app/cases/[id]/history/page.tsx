import Link from 'next/link';
import AppShell from '@/components/AppShell';
import RestoreSnapshotButton from './RestoreSnapshotButton';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

const money=(v:any)=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(v)||0);
const date=(v:any)=>new Intl.DateTimeFormat('nl-NL',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));

export default async function CalculationHistoryPage({params}:{params:Promise<{id:string}>}){
 const u=await requireUser(); const {id}=await params;
 const c=await db.case.findFirst({where:{id,userId:u.id},include:{calculations:{orderBy:{createdAt:'desc'},take:50}}});
 if(!c)return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;
 const locked=['APPROVED','FINAL'].includes(c.reviewStatus);
 return <AppShell><main className="content" style={{maxWidth:1200}}>
  <div className="page-head"><div><div className="eyebrow">Dossier · versiegeschiedenis</div><h1 className="page-title">Berekeningshistorie</h1><p className="page-subtitle">Alle opgeslagen rekenmomenten blijven als immutable snapshot beschikbaar. Een historische berekening kan gecontroleerd worden hersteld als nieuwe actuele versie.</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link><Link className="btn" href={`/cases/${id}/edit`}>Berekening wijzigen</Link></div></div>
  {locked?<div className="notice topgap">Dit dossier is {c.reviewStatus === 'FINAL' ? 'definitief' : 'goedgekeurd'}. Herstellen is geblokkeerd totdat het dossier opnieuw in behandeling is.</div>:null}
  <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">Historische berekeningen</h2><div className="panel-sub">Controleer engine-, normversie en uitkomst. Oude snapshots blijven onveranderd wanneer een nieuwe berekening wordt gemaakt of hersteld.</div></div></div>
   {c.calculations.length===0?<div className="notice">Nog geen berekeningshistorie.</div>:<div className="table-wrap"><table className="table"><thead><tr><th>Moment</th><th>Engine</th><th>Norm</th><th>KA-behoefte</th><th>KA-bijdrage</th><th>PAL bruto</th><th>Acties</th></tr></thead><tbody>{c.calculations.map((x:any,i:number)=>{const r=x.result||{};const transfers=r.transfers||[];const ka=transfers.reduce((s:number,t:any)=>s+Number(t.payment||0),0);const pal=Number(r.partnerSupport?.result?.monthlyGross||r.combined?.partnerSupport?.monthlyGross||0);const older=c.calculations[i+1];return <tr key={x.id}><td><b>{i===0?'Huidige berekening':'Historische snapshot'}</b><div className="table-note">{date(x.createdAt)}</div></td><td>{x.engineVersion}</td><td>{x.normVersion}</td><td>{money(r.totalNeed)}</td><td>{money(ka)}</td><td>{money(pal)}</td><td><div className="actions"><Link className="btn ghost" href={`/cases/${id}/history/${x.id}`}>Bekijken</Link>{older?<Link className="btn ghost" href={`/cases/${id}/history/compare/${older.id}/${x.id}`}>Vergelijk met vorige</Link>:null}{i>0?<RestoreSnapshotButton caseId={id} calculationId={x.id} locked={locked}/>:null}</div></td></tr>})}</tbody></table></div>}
  </section>
 </main></AppShell>;
}
