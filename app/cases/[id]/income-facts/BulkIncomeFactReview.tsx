"use client";

import { useMemo, useState } from "react";

type Fact = {
  id: string;
  label: string;
  key: string;
  valueNumber: number | null;
  valueText: string | null;
  unit: string | null;
  confidence: number | null;
  status: string;
  parentIndex: number | null;
  document: { name: string };
};

type Props = {
  caseId: string;
  facts: Fact[];
  parentA: string;
  parentB: string;
  locked: boolean;
};

export default function BulkIncomeFactReview({ caseId, facts, parentA, parentB, locked }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState<"APPROVED" | "REJECTED" | "PROPOSED">("APPROVED");
  const [parentIndex, setParentIndex] = useState<"0" | "1" | "">("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(() => facts.filter((fact) => fact.status !== action), [facts, action]);
  const allSelected = selectable.length > 0 && selectable.every((fact) => selected.includes(fact.id));

  function toggleAll() {
    setSelected(allSelected ? [] : selectable.map((fact) => fact.id));
  }

  async function submit() {
    setError(null);
    setMessage(null);
    if (selected.length === 0) return setError("Selecteer minimaal één inkomensfeit.");
    if (action === "APPROVED" && parentIndex === "") return setError("Kies eerst ouder A of ouder B.");
    setBusy(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/income-facts/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes: selected.map((factId) => ({
            factId,
            status: action,
            ...(action === "APPROVED" ? { parentIndex: Number(parentIndex) } : {}),
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Bulk review mislukt.");
      setMessage(`${data.changed ?? selected.length} inkomensfeit(en) verwerkt. De pagina wordt vernieuwd.`);
      setSelected([]);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk review mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel topgap">
      <div className="panel-head">
        <div>
          <div className="section-kicker">Snelle verwerking</div>
          <h2 className="panel-title">Bulk fact review</h2>
          <div className="panel-sub">Selecteer meerdere AI-voorstellen en verwerk ze in één transactie.</div>
        </div>
        <div className="table-note">{selected.length} geselecteerd</div>
      </div>
      <div className="actions" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn secondary" type="button" onClick={toggleAll} disabled={locked || selectable.length === 0}>
          {allSelected ? "Selectie wissen" : "Selecteer alle wijzigbare"}
        </button>
        <select className="input" value={action} onChange={(event) => { setAction(event.target.value as typeof action); setSelected([]); }} disabled={locked}>
          <option value="APPROVED">Goedkeuren</option>
          <option value="REJECTED">Afwijzen</option>
          <option value="PROPOSED">Heropenen</option>
        </select>
        {action === "APPROVED" && (
          <select className="input" value={parentIndex} onChange={(event) => setParentIndex(event.target.value as typeof parentIndex)} disabled={locked}>
            <option value="">Kies ouder</option>
            <option value="0">{parentA}</option>
            <option value="1">{parentB}</option>
          </select>
        )}
        <button className="btn" type="button" onClick={submit} disabled={locked || busy || selected.length === 0}>
          {busy ? "Verwerken…" : "Verwerk selectie"}
        </button>
      </div>
      {locked && <div className="notice">Dit dossier is vergrendeld; bulk review is uitgeschakeld.</div>}
      {message && <div className="notice success topgap">{message}</div>}
      {error && <div className="notice error topgap">{error}</div>}
      <div className="table-wrap topgap">
        <table className="table">
          <thead><tr><th>Selectie</th><th>Feit</th><th>Waarde</th><th>Status</th></tr></thead>
          <tbody>
            {facts.length === 0 ? <tr><td colSpan={4}>Geen inkomensfeiten beschikbaar.</td></tr> : facts.map((fact) => (
              <tr key={fact.id}>
                <td><input type="checkbox" checked={selected.includes(fact.id)} disabled={locked || fact.status === action} onChange={(event) => setSelected((current) => event.target.checked ? [...current, fact.id] : current.filter((id) => id !== fact.id))} /></td>
                <td><b>{fact.label}</b><div className="table-note">{fact.document.name}</div></td>
                <td>{fact.valueNumber != null ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(fact.valueNumber) : fact.valueText || "—"}{fact.unit ? <div className="table-note">{fact.unit}</div> : null}</td>
                <td>{fact.status === "APPROVED" ? "Goedgekeurd" : fact.status === "REJECTED" ? "Afgewezen" : "Voorstel"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
