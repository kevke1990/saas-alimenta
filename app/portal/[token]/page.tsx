"use client";
import { use, useEffect, useState } from "react";
import { MereloLogo } from "@/components/Brand";

const money = (v: unknown) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(v) || 0);

const statusLabel = (s: string) =>
  ({
    INCOMPLETE: "In behandeling",
    READY_FOR_REVIEW: "Klaar voor review",
    REVIEWED: "Beoordeeld",
    APPROVED: "Goedgekeurd",
    FINAL: "Definitief",
    ACTIVE: "Actief",
  }[s] || s || "In behandeling");

const categoryLabel = (c: string) =>
  ({
    IDENTITEIT: "Identiteit",
    IDENTITE: "Identiteit",
    INKOMEN: "Inkomen",
    ONDERNEMING: "Onderneming",
    WONEN: "Wonen",
    KINDEREN: "Kinderen",
    ZORGREGELING: "Zorgregeling",
    JURIDISCH: "Juridisch",
    BEREKENINGEN: "Berekeningen",
    FACTUREN: "Facturen",
    OVERIG: "Overig",
  }[c] || c || "Document");

export default function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch(`/api/portal/${encodeURIComponent(token)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(body?.error || "Deze portal-link is niet geldig.");
        return body;
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) {
    return (
      <main className="public-page">
        <div className="public-card">
          <MereloLogo />
          <div className="eyebrow topgap">Cliëntportaal</div>
          <h1 className="page-title">Toegang niet beschikbaar</h1>
          <div className="notice error topgap">{error}</div>
        </div>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="public-page">
        <div className="public-card">
          <MereloLogo />
          <p className="subtle topgap">Portaal wordt geladen…</p>
        </div>
      </main>
    );
  }

  const c = data.case;
  const latest = c.calculations?.[0];
  const r: any = latest?.result || c.result || {};
  const combined = r.combined || {};
  const childTotal = Number(combined.childSupportTotal ?? (r.transfers || []).reduce((s: number, t: any) => s + Number(t.payment || 0), 0));
  const palGross = Number(combined.partnerSupport?.monthlyGross || r.partnerSupport?.result?.monthlyGross || 0);
  const palNet = Number(combined.partnerSupport?.monthlyNet || r.partnerSupport?.result?.monthlyNet || 0);
  const totalMonthly = Number(combined.totalMonthlyPayments || childTotal + palGross);

  return (
    <main className="public-page">
      <div className="public-card" style={{ maxWidth: 960 }}>
        <div className="page-head">
          <div>
            <div className="eyebrow">Merelo · Cliëntportaal</div>
            <h1 className="page-title">{c.name}</h1>
            <p className="page-subtitle">Dit gedeelde dossier is alleen-lezen. Wijzigingen worden door je adviseur of mediator verwerkt.</p>
          </div>
          <MereloLogo />
        </div>

        <section className="panel topgap">
          <h2 className="panel-title">Dossiergegevens</h2>
          <div className="detail-grid topgap">
            <div className="detail-card">
              <div className="summary-line"><span>Cliënt</span><b>{c.client?.name || "—"}</b></div>
              <div className="summary-line"><span>Status</span><b>{statusLabel(c.reviewStatus || c.status)}</b></div>
              <div className="summary-line"><span>Laatst bijgewerkt</span><b>{new Date(c.updatedAt).toLocaleDateString("nl-NL")}</b></div>
            </div>
            {latest && (
              <div className="detail-card">
                <div className="summary-line"><span>Rekenmoment</span><b>{new Date(latest.createdAt).toLocaleDateString("nl-NL")}</b></div>
                <div className="summary-line"><span>Normversie</span><b>{latest.normVersion}</b></div>
                <div className="summary-line"><span>Rekenengine</span><b>{latest.engineVersion}</b></div>
              </div>
            )}
          </div>
        </section>

        {latest && (
          <section className="panel topgap">
            <h2 className="panel-title">Samenvatting laatste berekening</h2>
            <p className="panel-sub">Overzicht van de berekende maandelijkse bedragen op basis van de vastgelegde gegevens.</p>
            <div className="result-hero topgap">
              <div className="stat-card result-main">
                <div className="stat-label">TOTALE MAANDBETALING</div>
                <div className="stat-value al-tabular">{money(totalMonthly)}</div>
                <div className="stat-meta">Gecombineerd per maand</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">KINDERALIMENTATIE</div>
                <div className="stat-value al-tabular">{money(childTotal)}</div>
                <div className="stat-meta">Per maand</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">PARTNERALIMENTATIE BRUTO</div>
                <div className="stat-value al-tabular">{money(palGross)}</div>
                <div className="stat-meta">Netto: {money(palNet)} p/m</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">KINDERBEHOEFTE</div>
                <div className="stat-value al-tabular">{money(r.totalNeed)}</div>
                <div className="stat-meta">Draagkracht: {money(r.totalCapacity)}</div>
              </div>
            </div>
          </section>
        )}

        <section className="panel topgap">
          <h2 className="panel-title">Gedeelde documenten</h2>
          {c.documents?.length ? (
            <div className="stack topgap">
              {c.documents.map((d: any) => (
                <div key={d.id} className="summary-line">
                  <a href={`/api/portal/${encodeURIComponent(token)}/documents/${encodeURIComponent(d.id)}`} target="_blank" rel="noreferrer" className="table-link">
                    {d.name}
                  </a>
                  <span className="status gray">{categoryLabel(d.category)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty topgap">Er zijn nog geen gedeelde documenten in dit portaal.</div>
          )}
        </section>
      </div>
    </main>
  );
}
