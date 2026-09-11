"use client";
import { use, useEffect, useState } from "react";

export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetch(`/api/portal/${encodeURIComponent(token)}`).then(async r => { const body = await r.json().catch(() => ({})); if (!r.ok) throw new Error(body?.error || "Deze portal-link is niet geldig."); return body; }).then(setData).catch(e => setError(e.message)); }, [token]);
  if (error) return <main style={{maxWidth:760,margin:"80px auto",padding:24,fontFamily:"system-ui"}}><h1>Cliëntportaal</h1><p>{error}</p></main>;
  if (!data) return <main style={{maxWidth:760,margin:"80px auto",padding:24,fontFamily:"system-ui"}}><p>Portaal laden…</p></main>;
  const c=data.case; const latest=c.calculations?.[0];
  return <main style={{maxWidth:960,margin:"40px auto",padding:24,fontFamily:"system-ui"}}>
    <div style={{marginBottom:32}}><div style={{fontSize:13,textTransform:"uppercase",letterSpacing:1,color:"#64748b"}}>Alimenta Pro · Cliëntportaal</div><h1>{c.name}</h1><p style={{color:"#475569"}}>Dit gedeelde dossier is alleen-lezen. Wijzigingen worden door je professional verwerkt.</p></div>
    <section style={{border:"1px solid #e2e8f0",borderRadius:16,padding:24,marginBottom:20}}><h2>Dossier</h2><p><b>Cliënt:</b> {c.client?.name || "—"}</p><p><b>Status:</b> {c.reviewStatus || c.status}</p><p><b>Laatst bijgewerkt:</b> {new Date(c.updatedAt).toLocaleDateString("nl-NL")}</p></section>
    {latest && <section style={{border:"1px solid #e2e8f0",borderRadius:16,padding:24,marginBottom:20}}><h2>Laatste berekening</h2><p>Normversie: {latest.normVersion} · engine {latest.engineVersion}</p><pre style={{whiteSpace:"pre-wrap",background:"#f8fafc",padding:16,borderRadius:12,overflow:"auto"}}>{JSON.stringify(latest.result,null,2)}</pre></section>}
    <section style={{border:"1px solid #e2e8f0",borderRadius:16,padding:24}}><h2>Documenten</h2>{c.documents?.length ? <ul>{c.documents.map((d:any)=><li key={d.id} style={{margin:"10px 0"}}><a href={`/api/portal/${encodeURIComponent(token)}/documents/${encodeURIComponent(d.id)}`} target="_blank" rel="noreferrer" style={{color:"#2563eb",textDecoration:"underline"}}>{d.name}</a> <span style={{color:"#64748b"}}>({d.category})</span></li>)}</ul> : <p>Er zijn nog geen gedeelde documenten.</p>}</section>
  </main>;
}
