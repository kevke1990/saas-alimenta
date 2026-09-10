import Link from "next/link";
import AppShell from "@/components/AppShell";
import {requireUser} from "@/lib/auth";
import {db} from "@/lib/db";
import DocumentPanel from "./DocumentPanel";
import DeleteClientButton from "./DeleteClientButton";

const reviewLabel=(v:string)=>({INCOMPLETE:"Te controleren",READY_FOR_REVIEW:"Klaar voor review",REVIEWED:"Gereviewd",APPROVED:"Goedgekeurd",FINAL:"Definitief"}[v]||v||"Onbekend");
const reviewClass=(v:string)=>v==="FINAL"||v==="APPROVED"||v==="REVIEWED"?"green":v==="READY_FOR_REVIEW"?"amber":"gray";
const aiLabel=(v:string)=>({NOT_ANALYZED:"Nog niet geanalyseerd",PROCESSING:"Bezig",COMPLETED:"Geanalyseerd",FAILED:"Mislukt"}[v]||v||"Onbekend");
const date=(v:Date)=>new Intl.DateTimeFormat("nl-NL",{day:"2-digit",month:"short",year:"numeric"}).format(v);

export default async function ClientPage({params}:{params:Promise<{id:string}>}){
 const u=await requireUser();const {id}=await params;
 const c=await db.client.findFirst({where:{id,userId:u.id},include:{cases:{orderBy:{updatedAt:"desc"}},documents:{orderBy:{createdAt:"desc"},take:20}}});
 if(!c)return <AppShell><div className="notice error">Cliënt niet gevonden.</div></AppShell>;
 const cases=c.cases;
 const openCases=cases.filter(x=>x.reviewStatus!=="FINAL"&&x.reviewStatus!=="APPROVED");
 const readyCases=cases.filter(x=>x.reviewStatus==="READY_FOR_REVIEW");
 const attentionCases=cases.filter(x=>x.reviewStatus==="INCOMPLETE");
 const aiPending=c.documents.filter(x=>x.aiStatus!=="COMPLETED").length;
 return <AppShell>
  <div className="page-head"><div><div className="eyebrow">Cliëntwerkplek · gezin</div><h1 className="page-title">{c.name}</h1><p className="page-subtitle">{c.reference||"Geen klantnummer"} · {c.email||"Geen e-mail geregistreerd"}</p></div><div className="actions"><Link className="btn secondary" href="/clients">← Cliënten</Link><Link className="btn secondary" href={`/clients/${c.id}/edit`}>Gezin bewerken</Link><Link className="btn" href={`/cases/new?clientId=${c.id}`}>+ Nieuw dossier</Link><DeleteClientButton clientId={c.id} clientName={c.name} caseCount={cases.length}/></div></div>

  <section className="result-overview">
   <div className="result-metric"><div className="stat-label">DOSSIERS</div><div className="metric-value">{cases.length}</div><span>{openCases.length} open</span></div>
   <div className="result-metric"><div className="stat-label">KLAAR VOOR REVIEW</div><div className="metric-value">{readyCases.length}</div><span>professionele controle</span></div>
   <div className="result-metric"><div className="stat-label">AANDACHT NODIG</div><div className="metric-value">{attentionCases.length}</div><span>incomplete dossiers</span></div>
   <div className="result-metric"><div className="stat-label">DOCUMENTEN</div><div className="metric-value">{c.documents.length}</div><span>{aiPending} zonder afgeronde AI-analyse</span></div>
  </section>

  <section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">Werkvoorraad</div><h2 className="panel-title">Wat vraagt nu aandacht?</h2><div className="panel-sub">Open dossiers en controlepunten voor dit gezin.</div></div></div>
   {openCases.length===0?<div className="empty">Geen open dossiers. Dit gezin heeft geen actieve werkvoorraad.</div>:<div className="detail-grid">{openCases.slice(0,6).map(x=><div className="detail-card" key={x.id}><div className="detail-card-head"><div><b>{x.name}</b><span>{x.calculationVersion}</span></div><span className={`status ${reviewClass(x.reviewStatus)}`}>{reviewLabel(x.reviewStatus)}</span></div><div className="summary-line"><span>Laatst bijgewerkt</span><b>{date(x.updatedAt)}</b></div><div className="actions topgap"><Link className="btn secondary" href={`/cases/${x.id}`}>Dossier</Link><Link className="btn" href={`/cases/${x.id}/workflow`}>Workflow →</Link></div></div>)}</div>}
  </section>

  <section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">Gezinsleden</div><h2 className="panel-title">Contact & gezin</h2><div className="panel-sub">Deze personen worden automatisch voorgesteld bij een nieuw dossier.</div></div></div><div className="two-col"><div className="quick-card"><b>Persoon A</b><div className="topgap">{c.personAName||"Nog niet ingevuld"}</div><div className="subtle">{c.personAEmail||"Geen e-mail"} · {c.personAPhone||"Geen telefoon"}</div></div><div className="quick-card"><b>Persoon B</b><div className="topgap">{c.personBName||"Nog niet ingevuld"}</div><div className="subtle">{c.personBEmail||"Geen e-mail"} · {c.personBPhone||"Geen telefoon"}</div></div></div></section>

  <section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">Dossierstatus</div><h2 className="panel-title">Alle dossiers</h2><div className="panel-sub">De volledige voortgang van alle berekeningen voor dit gezin.</div></div></div>{cases.length===0?<div className="empty">Nog geen dossiers. Start een nieuwe berekening om te beginnen.</div>:<div className="table-wrap"><table className="table"><thead><tr><th>Dossier</th><th>Workflow</th><th>Normversie</th><th>Bijgewerkt</th><th></th></tr></thead><tbody>{cases.map(x=><tr key={x.id}><td><Link className="table-link" href={`/cases/${x.id}`}>{x.name}</Link></td><td><span className={`status ${reviewClass(x.reviewStatus)}`}>{reviewLabel(x.reviewStatus)}</span></td><td>{x.calculationVersion}</td><td>{date(x.updatedAt)}</td><td><Link className="table-link" href={`/cases/${x.id}/workflow`}>Open workflow →</Link></td></tr>)}</tbody></table></div>}</section>

  <DocumentPanel clientId={c.id} documents={c.documents}/>

  {c.notes&&<section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">Intern</div><h2 className="panel-title">Interne notities</h2></div></div><p className="page-subtitle" style={{whiteSpace:"pre-wrap"}}>{c.notes}</p></section>}
 </AppShell>;
}
