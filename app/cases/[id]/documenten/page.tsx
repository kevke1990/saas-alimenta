import Link from "next/link";
import AppShell from "@/components/AppShell";
import DocumentUploadForm from "./DocumentUploadForm";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const labels: Record<string, string> = { NOT_ANALYZED: "Niet geanalyseerd", PROCESSING: "Bezig", COMPLETED: "Geanalyseerd", ANALYZED: "Geanalyseerd", FAILED: "Analyse mislukt", DISABLED: "AI uitgeschakeld", SKIPPED: "Overgeslagen", TOO_LARGE: "Te groot", RATE_LIMITED: "AI-limiet" };
const factLabel = (s: string) => s === "APPROVED" ? "Goedgekeurd" : s === "REJECTED" ? "Afgewezen" : "Voorstel";

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: u.id }, include: { client: true, documents: { orderBy: { createdAt: "desc" }, include: { incomeFacts: { orderBy: { createdAt: "asc" } } } } } });
  if (!c) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;
  const facts = c.documents.flatMap(d => d.incomeFacts);
  const proposed = facts.filter(f => f.status === "PROPOSED").length;
  const approved = facts.filter(f => f.status === "APPROVED").length;

  return <AppShell>
    <div className="page-head"><div><div className="eyebrow">Fase B · documenten</div><h1 className="page-title">Documenten & gegevensinname</h1><p className="page-subtitle">{c.name} · {c.client?.name || "Zonder cliënt"}</p></div><div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link><Link className="btn secondary" href={`/cases/${id}/income-facts`}>Fact review</Link></div></div>
    <div className="result-hero"><div className="stat-card result-main"><div className="stat-label">DOCUMENTEN</div><div className="stat-value">{c.documents.length}</div><div className="stat-meta">Veilig opgeslagen in het dossier</div></div><div className="stat-card"><div className="stat-label">AI-VOORSTELLEN</div><div className="stat-value">{proposed}</div><div className="stat-meta">Wachten op beoordeling</div></div><div className="stat-card"><div className="stat-label">GOEDGEKEURD</div><div className="stat-value">{approved}</div><div className="stat-meta">Professioneel bevestigd</div></div></div>

    <section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">Nieuwe documentinname</div><h2 className="panel-title">Bestand uploaden</h2><div className="panel-sub">Upload een salarisstrook, jaaropgave, contract of ander inkomensdocument. Het bestand wordt versleuteld opgeslagen; AI-extractie blijft altijd een voorstel.</div></div></div><DocumentUploadForm caseId={id} clientId={c.clientId}/></section>

    <section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">Snelle tekstinname</div><h2 className="panel-title">Documenttekst toevoegen</h2><div className="panel-sub">Voor kopiëren/plakken uit een bron. Ook deze route gebruikt dezelfde beveiligde opslag en professionele fact review.</div></div></div><form action={`/api/cases/${id}/documents`} method="post" style={{ display: "grid", gap: 14 }}><label><span className="field-label">Documentnaam</span><input className="input" name="name" defaultValue="Inkomensdocument" required maxLength={180}/></label><label><span className="field-label">Documenttekst</span><textarea className="input" name="text" rows={12} placeholder="Plak hier bijvoorbeeld een salarisstrook, jaaropgave of inkomensoverzicht..." required/></label><input type="hidden" name="mimeType" value="text/plain"/><div className="notice">AI-extractie levert uitsluitend <b>voorstellen</b>. Geen enkel feit wordt automatisch goedgekeurd of als definitieve berekeningsinvoer behandeld.</div><button className="btn" type="submit">Tekst opslaan + AI analyseren</button></form></section>

    <section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">Documentregister</div><h2 className="panel-title">Dossierdocumenten</h2></div></div>{c.documents.length === 0 ? <div className="empty">Nog geen documenten toegevoegd.</div> : <div className="table-wrap"><table className="table"><thead><tr><th>Document</th><th>AI-status</th><th>Feiten</th><th>Bron</th></tr></thead><tbody>{c.documents.map(d => <tr key={d.id}><td><a className="table-link" href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer">{d.name}</a><div className="table-note">{d.sizeBytes.toLocaleString("nl-NL")} bytes · {new Date(d.createdAt).toLocaleString("nl-NL")}</div></td><td><span className={`status ${d.aiStatus === "COMPLETED" || d.aiStatus === "ANALYZED" ? "green" : d.aiStatus === "FAILED" ? "red" : "amber"}`}>{labels[d.aiStatus] || d.aiStatus}</span></td><td>{d.incomeFacts.length} {d.incomeFacts.length === 1 ? "feit" : "feiten"}{d.incomeFacts.length > 0 && <div className="table-note">{d.incomeFacts.filter(f => f.status === "PROPOSED").length} voorstellen</div>}</td><td>{d.source}</td></tr>)}</tbody></table></div>}</section>

    <section className="panel topgap"><div className="panel-head"><div><div className="section-kicker">Workflow</div><h2 className="panel-title">Document → AI → professional → berekening</h2></div></div><div className="notice success">1. Document veilig opslaan → 2. tekst/OCR-extractie → 3. AI-extractie → 4. feiten als voorstel → 5. professional controleert/keurt goed → 6. pas daarna opnemen in de berekening.</div><div className="actions topgap"><Link className="btn" href={`/cases/${id}/income-facts`}>Open professionele fact review →</Link><Link className="btn secondary" href={`/cases/${id}/review`}>Open volledige review →</Link></div></section>
  </AppShell>;
}
