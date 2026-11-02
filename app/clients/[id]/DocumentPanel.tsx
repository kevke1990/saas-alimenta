"use client";
import Link from "next/link";
import { useState } from "react";

const aiStatusLabel: Record<string, string> = {
  NOT_ANALYZED: "Niet geanalyseerd",
  PROCESSING: "Bezig met analyse",
  COMPLETED: "Geanalyseerd",
  ANALYZED: "Geanalyseerd",
  FAILED: "Analyse mislukt",
  DISABLED: "AI uitgeschakeld",
  SKIPPED: "Overgeslagen",
};

export default function DocumentPanel({ clientId, documents }: { clientId: string; documents: any[] }) {
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState(documents);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function analyze(id: string) {
    setBusy(true);
    setErrorMsg("");
    try {
      const r = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentId: id }),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setResult(j.aiResult || j);
      setItems((x) => x.map((d) => (d.id === id ? { ...d, aiStatus: "COMPLETED", aiResult: j.aiResult } : d)));
    } catch (e: any) {
      setErrorMsg(e.message || "AI-analyse mislukt.");
    } finally {
      setBusy(false);
    }
  }

  const facts: any[] = Array.isArray(result?.facts) ? result.facts : Array.isArray(result?.incomeFacts) ? result.incomeFacts : [];

  return (
    <section className="panel topgap">
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Documenten & inkomensanalyse</h2>
          <div className="panel-sub">Scan of upload loonstroken, jaaropgaven en andere stukken. Laat AI voorstellen doen en controleer ieder veld.</div>
        </div>
        <Link className="btn secondary" href={`/scan?clientId=${clientId}`}>+ Scan</Link>
      </div>
      {errorMsg && <div className="notice error topgap">{errorMsg}</div>}
      {items.length === 0 ? (
        <div className="empty">Nog geen documenten.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Document</th><th>Type</th><th>AI-status</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td><a className="table-link" href={`/api/documents/${d.id}`} target="_blank" rel="noreferrer">{d.name}</a></td>
                  <td>{d.mimeType}</td>
                  <td><span className={`status ${d.aiStatus === "COMPLETED" || d.aiStatus === "ANALYZED" ? "green" : d.aiStatus === "FAILED" ? "red" : "gray"}`}>{aiStatusLabel[d.aiStatus] || d.aiStatus}</span></td>
                  <td><button className="btn secondary" disabled={busy || d.aiStatus === "PROCESSING"} onClick={() => analyze(d.id)}>{busy ? "Bezig…" : "AI analyseren"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result && (
        <div className="notice success topgap">
          <b>AI-analyse afgerond.</b>
          {facts.length > 0 ? (
            <div className="stack topgap">
              {facts.map((f: any, idx: number) => (
                <div className="summary-line" key={idx}>
                  <span>{f.label || f.key || "Gegeven"}</span>
                  <b>{f.valueNumber != null ? `€ ${Number(f.valueNumber).toLocaleString("nl-NL")}` : String(f.valueText || "—")}</b>
                </div>
              ))}
            </div>
          ) : (
            <p className="subtle" style={{ marginTop: 6 }}>De voorgestelde inkomensfeiten staan klaar ter beoordeling in het gekoppelde dossier.</p>
          )}
        </div>
      )}
      <div className="notice topgap">AI is een extractielaag, geen beslisser. De professional blijft verantwoordelijk voor controle en accordering.</div>
    </section>
  );
}
