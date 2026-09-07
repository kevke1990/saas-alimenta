"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "INCOMPLETE" | "READY_FOR_REVIEW" | "REVIEWED" | "APPROVED" | "FINAL";

const nextStatus: Partial<Record<Status, Status>> = {
  READY_FOR_REVIEW: "REVIEWED",
  REVIEWED: "APPROVED",
  APPROVED: "FINAL",
};

export default function DemoWorkflowActions({ caseId, status }: { caseId: string; status: Status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const target = nextStatus[status];

  async function advance() {
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/cases/${caseId}/approval`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      if (!response.ok) throw new Error(await response.text());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Demo-workflow mislukt.");
    } finally {
      setBusy(false);
    }
  }

  if (!target) return null;

  const label = target === "REVIEWED" ? "Review afronden" : target === "APPROVED" ? "Demo goedkeuren" : "Demo FINAL maken";
  return <div className="topgap">
    <div className="actions">
      <button type="button" className="btn" onClick={advance} disabled={busy}>{busy ? "Bezig…" : `▶ ${label}`}</button>
    </div>
    <div className="field-help">Alle normale server-side reviewcontroles blijven actief. Dit is alleen een snelpad voor het fictieve demo-dossier.</div>
    {error && <div className="notice error topgap">{error}</div>}
  </div>;
}
