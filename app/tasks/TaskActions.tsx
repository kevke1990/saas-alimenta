"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TaskActions({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: "COMPLETED" | "CANCELLED") {
    setBusy(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await response.text());
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Taak bijwerken mislukt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="actions">
      <button className="btn secondary" type="button" onClick={() => setStatus("COMPLETED")} disabled={busy}>
        {busy ? "Bezig…" : "Afronden"}
      </button>
      <button className="btn ghost" type="button" onClick={() => setStatus("CANCELLED")} disabled={busy}>
        Annuleren
      </button>
    </div>
  );
}
