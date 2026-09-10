"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteClientButton({ clientId, clientName, caseCount }: { clientId: string; clientName: string; caseCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function removeClient() {
    if (caseCount > 0) return;
    if (!window.confirm(`Cliënt “${clientName}” definitief verwijderen? Alle cliëntgegevens en bijbehorende documenten worden verwijderd. Dit kan niet ongedaan worden gemaakt.`)) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Cliënt verwijderen mislukt.");
      }
      router.push("/clients");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cliënt verwijderen mislukt.");
      setBusy(false);
    }
  }

  if (caseCount > 0) {
    return <span className="client-delete-disabled" title="Archiveer de cliënt zolang er dossiers aanwezig zijn.">Verwijderen via archiveren</span>;
  }

  return (
    <div className="client-delete-wrap">
      <button className="btn danger" type="button" onClick={removeClient} disabled={busy}>
        {busy ? "Verwijderen…" : "Cliënt verwijderen"}
      </button>
      {error && <span className="client-delete-error" role="alert">{error}</span>}
    </div>
  );
}
