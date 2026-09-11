import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const date = (v: Date) => new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));
const labels: Record<string,string> = {
  CASE_READY_FOR_REVIEW: "Klaar voor review",
  CASE_REVIEW_STARTED: "Review gestart",
  CASE_REVIEW_CHECKED: "Reviewonderdeel gecontroleerd",
  CASE_REVIEW_COMMENTED: "Reviewopmerking",
  CASE_REVIEWED: "Dossier gereviewd",
  CASE_APPROVED: "Dossier goedgekeurd",
  CASE_FINAL: "Dossier definitief gemaakt",
  CASE_REOPENED: "Dossier heropend",
  CALCULATION_CREATED: "Nieuwe berekening",
  CALCULATION_RESTORED: "Berekening hersteld",
  PROFESSIONAL_OVERRIDE: "Professionele afwijking",
  DOCUMENT_UPLOADED: "Document toegevoegd",
  DOCUMENT_AI_ANALYZED: "Document door AI geanalyseerd",
  DOCUMENT_AI_FAILED: "AI-analyse mislukt",
  INCOME_FACT_APPROVED: "Inkomensgegeven goedgekeurd",
};

const tone = (action: string) => action.includes("APPROVED") || action.includes("FINAL") ? "green" : action.includes("FAILED") ? "red" : action.includes("REVIEW") || action.includes("OVERRIDE") ? "amber" : "gray";

export default async function CaseActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const c = await db.case.findFirst({ where: { id, userId: u.id }, include: { client: true } });
  if (!c) return <AppShell><div className="notice error">Dossier niet gevonden.</div></AppShell>;

  const logs = await db.auditLog.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const history = logs.filter(x => String((x.metadata as any)?.caseId || "") === id);

  return <AppShell><main className="content" style={{ maxWidth: 1050 }}>
    <div className="page-head">
      <div><div className="eyebrow">Dossier · audittrail</div><h1 className="page-title">Activiteit</h1><p className="page-subtitle">Eén chronologische tijdlijn van review, berekeningen, documenten, professionele afwijkingen en goedkeuringen.</p></div>
      <div className="actions"><Link className="btn secondary" href={`/cases/${id}`}>← Dossier</Link><Link className="btn secondary" href={`/cases/${id}/review`}>Reviewcentrum</Link><Link className="btn secondary" href={`/cases/${id}/history`}>Berekeningshistorie</Link></div>
    </div>

    <section className="panel topgap">
      <div className="panel-head"><div><h2 className="panel-title">{history.length} gebeurtenissen</h2><div className="panel-sub">Alleen gebeurtenissen die aantoonbaar aan dit dossier gekoppeld zijn worden getoond.</div></div><span className={`status ${c.reviewStatus === "FINAL" ? "green" : "amber"}`}>{c.reviewStatus}</span></div>
      {history.length === 0 ? <div className="empty-state"><h3>Nog geen activiteit</h3><p>Zodra er een dossieractie wordt uitgevoerd verschijnt die hier in de audittrail.</p></div> : <div style={{ display: "grid", gap: 0, marginTop: 20 }}>
        {history.map((item, index) => {
          const meta = (item.metadata && typeof item.metadata === "object") ? item.metadata as Record<string,unknown> : {};
          const action = String(item.action);
          const label = labels[action] || action.replaceAll("_", " ").toLowerCase().replace(/^./, x => x.toUpperCase());
          const detail = [meta.section ? `Onderdeel: ${String(meta.section)}` : null, meta.field ? `Veld: ${String(meta.field)}` : null, meta.engineVersion ? `Engine: ${String(meta.engineVersion)}` : null, meta.normVersion ? `Norm: ${String(meta.normVersion)}` : null, meta.reason ? `Reden: ${String(meta.reason)}` : null, meta.comment ? `Opmerking: ${String(meta.comment)}` : null].filter(Boolean).join(" · ");
          return <div key={item.id} style={{ display: "grid", gridTemplateColumns: "18px 1fr", columnGap: 18, minHeight: index === history.length - 1 ? 100 : 115 }}>
            <div style={{ position: "relative" }}><span style={{ display: "block", width: 12, height: 12, borderRadius: "50%", marginTop: 7, background: "currentColor" }} className={`status-dot ${tone(action)}`}></span>{index !== history.length - 1 && <span style={{ position: "absolute", left: 5, top: 19, bottom: 0, width: 2, background: "#e5e7eb" }} />}</div>
            <div style={{ paddingBottom: 22 }}><div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><b>{label}</b><span className={`status ${tone(action)}`}>{action}</span><span className="table-note">{date(item.createdAt)}</span></div>{detail && <div className="subtle" style={{ marginTop: 8, lineHeight: 1.55 }}>{detail}</div>}</div>
          </div>;
        })}
      </div>}
    </section>
  </main></AppShell>;
}
