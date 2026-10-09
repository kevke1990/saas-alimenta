"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function CaseActions({ caseId, locked }: { caseId: string; locked?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

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
      setOpen(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="actions" style={{ position: 'relative' }}>
      <details ref={detailsRef} className="dropdown-menu" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary className="btn ghost" style={{ listStyle: 'none', cursor: 'pointer', padding: '6px 10px' }}>
          •••
        </summary>
        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 10, background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', boxShadow: 'var(--shadow)', padding: '4px', display: 'flex', flexDirection: 'column', minWidth: '140px', marginTop: '4px' }}>
          <Link className="btn ghost" style={{ justifyContent: 'flex-start' }} href={`/cases/${caseId}/edit/wizard`}>Wijzigen</Link>
          <Link className="btn ghost" style={{ justifyContent: 'flex-start' }} href={`/cases/${caseId}/documenten`}>Documenten</Link>
          <Link className="btn ghost" style={{ justifyContent: 'flex-start' }} href={`/cases/${caseId}/history`}>Historie</Link>
          <Link className="btn ghost" style={{ justifyContent: 'flex-start' }} href={`/cases/${caseId}/workflow`}>Workflow</Link>
          <Link className="btn ghost" style={{ justifyContent: 'flex-start' }} href={`/cases/${caseId}/review`}>Review</Link>
          {!locked && <button className="btn ghost" style={{ justifyContent: 'flex-start', textAlign: 'left' }} type="button" onClick={archive} disabled={busy}>{busy ? "Archiveren…" : "Archiveren"}</button>}
        </div>
      </details>
    </div>
  );
}