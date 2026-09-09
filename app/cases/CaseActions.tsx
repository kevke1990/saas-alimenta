"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CaseActions({ caseId, locked }: { caseId: string; locked?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function archive() {
    if (!window.confirm("Dit dossier archiveren? Het dossier wordt niet verwijderd uit de audittrail.")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/cases/${caseId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await response.text());
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Archiveren mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="actions">
      <Link className="btn ghost" href={`/cases/${caseId}`}>Open →</Link>
      <Link className="btn ghost" href={`/cases/${caseId}/edit`}>Wijzigen</Link>
      <Link className="btn ghost" href={`/cases/${caseId}/workflow`}>Workflow</Link>
      <Link className="btn ghost" href={`/cases/${caseId}/review`}>Review</Link>
      {!locked && <button className="btn ghost" type="button" onClick={archive} disabled={busy}>{busy ? "Archiveren…" : "Archiveren"}</button>}
    </div>
  );
}
