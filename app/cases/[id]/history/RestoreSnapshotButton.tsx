'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RestoreSnapshotButton({ caseId, calculationId, locked = false }: { caseId: string; calculationId: string; locked?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function restore() {
    if (busy || locked) return;
    const confirmed = window.confirm('Herstel deze historische berekening als een nieuwe actuele versie? De historische snapshot blijft ongewijzigd.');
    if (!confirmed) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/restore/${calculationId}`, { method: 'POST' });
      if (!response.ok) throw new Error(await response.text());
      router.push(`/cases/${caseId}/history`);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Herstellen mislukt.');
      setBusy(false);
    }
  }

  return (
    <button className="btn" type="button" onClick={restore} disabled={busy || locked} title={locked ? 'Heropen eerst de beoordeling van dit dossier.' : undefined}>
      {busy ? 'Herstellen…' : 'Herstellen als nieuwe versie'}
    </button>
  );
}
