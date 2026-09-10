"use client";

import { FormEvent, useState } from "react";

export default function DocumentUploadForm({ caseId, clientId }: { caseId: string; clientId?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const upload = await fetch("/api/documents/upload", { method: "POST", body: form });
      if (!upload.ok) throw new Error(await upload.text());
      const document = await upload.json();
      const analysis = await fetch(`/api/documents/analyze`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documentId: document.id }) });
      if (!analysis.ok) {
        setMessage(`Document opgeslagen. AI-analyse is nog niet uitgevoerd: ${await analysis.text()}`);
      } else {
        setMessage("Document opgeslagen en AI-analyse uitgevoerd. Controleer de voorgestelde feiten in Fact review.");
      }
      event.currentTarget.reset();
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error: any) {
      setMessage(error?.message || "Upload mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} encType="multipart/form-data" style={{ display: "grid", gap: 14 }}>
      <label>
        <span className="field-label">Bestand</span>
        <input className="input" type="file" name="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,image/jpeg,image/png,image/webp" required />
      </label>
      <input type="hidden" name="caseId" value={caseId} />
      {clientId && <input type="hidden" name="clientId" value={clientId} />}
      <div className="notice">Ondersteund: PDF, DOCX, TXT, CSV, JPG, PNG en WEBP. Bestanden worden versleuteld opgeslagen. AI-uitvoer blijft een voorstel voor professionele controle.</div>
      {message && <div className="notice">{message}</div>}
      <button className="btn" type="submit" disabled={busy}>{busy ? "Document verwerken…" : "Document uploaden + analyseren"}</button>
    </form>
  );
}
