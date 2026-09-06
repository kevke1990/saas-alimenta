import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const money=(v:any)=>new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(Number(v)||0);
const date=(v:any)=>new Intl.DateTimeFormat("nl-NL",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(v));

export default async function CasesPage(){
  const u=await requireUser();
  const cases=await db.case.findMany({where:{userId:u.id},include:{client:true,calculations:{orderBy:{createdAt:"desc"},take:1}},orderBy:{updatedAt:"desc"}});
  return <AppShell>
    <div className="page-head"><div><div className="eyebrow">Werkplek · dossiers</div><h1 className="page-title">Dossiers</h1><p className="page-subtitle">Alle alimentatieberekeningen, met versiehistorie en cliëntkoppeling.</p></div><Link className="btn" href="/cases/new">+ Nieuwe berekening</Link></div>
    <section className="panel">
      <div className="panel-head"><div><h2 className="panel-title">Dossieroverzicht</h2><div className="panel-sub">{cases.length} {cases.length===1?"dossier":"dossiers"}</div></div></div>
      {cases.length===0 ? <div className="empty-state"><h3>Nog geen dossiers</h3><p>Start je eerste berekening vanuit de wizard.</p><Link className="btn" href="/cases/new">Nieuwe berekening</Link></div> :
      <div className="table-wrap"><table className="table"><thead><tr><th>Dossier</th><th>Cliënt</th><th>Status</th><th>Laatste resultaat</th><th>Norm / engine</th><th>Bijgewerkt</th><th></th></tr></thead><tbody>{cases.map(c=>{const r:any=c.result||{};const calc=c.calculations[0];return <tr key={c.id}><td><Link className="table-link" href={`/cases/${c.id}`}>{c.name}</Link></td><td>{c.client?.name||"—"}</td><td><span className={`status ${c.status==="CALCULATED"?"green":"gray"}`}>{c.status==="CALCULATED"?"Berekend":c.status}</span></td><td>{money(r.totalNeed)}</td><td>{calc?`${calc.normVersion} · ${calc.engineVersion}`:c.calculationVersion}</td><td>{date(c.updatedAt)}</td><td><Link className="btn ghost" href={`/cases/${c.id}`}>Open →</Link></td></tr>})}</tbody></table></div>}
    </section>
  </AppShell>
}
