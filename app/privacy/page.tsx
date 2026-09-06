import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import PrivacyActions from "./PrivacyActions";

export default async function PrivacyPage(){
 const u=await requireUser();
 const clients=await db.client.findMany({where:{userId:u.id,status:"ACTIVE"},select:{id:true,name:true,email:true,reference:true},orderBy:{name:"asc"}});
 return <AppShell><div className="page-head"><div><div className="eyebrow">Privacy & AVG</div><h1 className="page-title">Privacycentrum</h1><p className="page-subtitle">Beheer rechten van betrokkenen, inzage, dataportabiliteit, bezwaar en verwijdering vanuit één plek.</p></div><Link className="btn secondary" href="/clients">← Cliënten</Link></div>
 <section className="panel"><div className="panel-head"><div><h2 className="panel-title">Cliëntrechten</h2><div className="panel-sub">Gebruik alleen voor een geverifieerd verzoek van de betrokkene of diens rechtsgeldige vertegenwoordiger.</div></div></div>{clients.length===0?<div className="empty">Geen actieve cliënten.</div>:<div className="table-wrap"><table className="table"><thead><tr><th>Cliënt</th><th>E-mail</th><th>Referentie</th><th>Acties</th></tr></thead><tbody>{clients.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.email||"—"}</td><td>{c.reference||"—"}</td><td><PrivacyActions clientId={c.id} clientName={c.name}/></td></tr>)}</tbody></table></div>}</section>
 <section className="panel topgap"><div className="panel-head"><div><h2 className="panel-title">AVG-by-design</h2><div className="panel-sub">De applicatie ondersteunt de belangrijkste operationele maatregelen; juridische verantwoordelijkheid blijft bij de verwerkingsverantwoordelijke.</div></div></div><div className="two-col"><div className="quick-card"><b>Rechten</b><p className="subtle">Inzage · rectificatie · beperking · bezwaar · dataportabiliteit · wissing</p></div><div className="quick-card"><b>AI opt-out</b><p className="subtle">AI-documentanalyse kan centraal worden uitgeschakeld via AI_PROCESSING_DISABLED=true.</p></div><div className="quick-card"><b>Dataminimalisatie</b><p className="subtle">Geen persoonsgegevens naar Gemini sturen tenzij de verwerking hiervoor is toegestaan en ingericht.</p></div><div className="quick-card"><b>Bewaartermijnen</b><p className="subtle">Gebruik een tenant-specifiek bewaarbeleid en leg wettelijke uitzonderingen vast voordat automatische verwijdering wordt geactiveerd.</p></div></div></section>
 </AppShell>
}
