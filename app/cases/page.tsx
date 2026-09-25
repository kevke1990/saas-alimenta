import Link from "next/link";
import AppShell from "@/components/AppShell";
import CaseActions from "./CaseActions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateWorkScore, hasLargeCalculationChange } from "@/lib/work-score";

const money = (v: any) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(v) || 0);

const date = (v: any) =>
  new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(v));

const reviewLabel = (v: string) =>
  v === "FINAL"
    ? "Definitief"
    : v === "APPROVED"
      ? "Goedgekeurd"
      : v === "REVIEWED"
        ? "Gereviewd"
        : v === "READY_FOR_REVIEW"
          ? "Klaar voor review"
          : v === "IN_REVIEW"
            ? "In review"
            : "Te controleren";

const reviewClass = (v: string) =>
  v === "FINAL" || v === "APPROVED"
    ? "green"
    : v === "REVIEWED" || v === "READY_FOR_REVIEW" || v === "IN_REVIEW"
      ? "amber"
      : "gray";

const workClass = (score: number) => (score < 40 ? "red" : score < 60 ? "amber" : "green");

type SearchParams = Promise<{ q?: string; review?: string }>;

export default async function CasesPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const u = await requireUser();
  const params = searchParams ? await searchParams : {};
  const q = String(params.q || "").trim();
  const allowedReviews = ["INCOMPLETE", "READY_FOR_REVIEW", "IN_REVIEW", "REVIEWED", "APPROVED", "FINAL"];
  const review = allowedReviews.includes(String(params.review)) ? String(params.review) : "";

  const baseWhere = {
    userId: u.id,
    status: { in: ["DRAFT", "CALCULATED"] },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { client: { name: { contains: q, mode: "insensitive" as const } } },
            { client: { reference: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const cases = await db.case.findMany({
    where: {
      ...baseWhere,
      ...(review ? { reviewStatus: review } : {}),
    },
    include: {
      client: true,
      calculations: { orderBy: { createdAt: "desc" }, take: 2 },
      documents: {
        select: {
          id: true,
          aiStatus: true,
          incomeFacts: { select: { status: true } },
        },
      },
      tasks: {
        where: { userId: u.id, status: "OPEN" },
        select: { dueAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const reviewCases = await db.case.findMany({
    where: baseWhere,
    select: { reviewStatus: true },
  });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const reviewCounts = allowedReviews.reduce<Record<string, number>>((acc, value) => {
    acc[value] = reviewCases.filter((item) => item.reviewStatus === value).length;
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="cases-page">
        <header className="cases-header">
          <div>
            <div className="eyebrow">Werkplek · dossiers</div>
            <h1 className="page-title">Dossiers & berekeningen</h1>
            <p className="page-subtitle">
              Beheer actieve alimentatiedossiers, reviewstatus, documentinname en berekeningsversies.
            </p>
          </div>
          <div className="actions cases-header-actions">
            <Link className="btn secondary" href="/work">
              Werkvoorraad
            </Link>
            <Link className="btn" href="/cases/new">
              + Nieuwe berekening
            </Link>
          </div>
        </header>

        <section className="cases-summary" aria-label="Dossierstatus">
          <div className="cases-summary-main">
            <span className="cases-summary-label">Resultaat</span>
            <strong>{cases.length}</strong>
            <span>{cases.length === 1 ? "dossier" : "dossiers"} in deze weergave</span>
          </div>
          {[
            ["INCOMPLETE", "Te controleren"],
            ["READY_FOR_REVIEW", "Klaar voor review"],
            ["IN_REVIEW", "In review"],
            ["REVIEWED", "Gereviewd"],
            ["FINAL", "Definitief"],
          ].map(([value, label]) => (
            <Link
              key={value}
              href={`/cases?review=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`cases-summary-item${review === value ? " is-active" : ""}`}
              aria-current={review === value ? "page" : undefined}
            >
              <span>{label}</span>
              <strong>{reviewCounts[value]}</strong>
            </Link>
          ))}
        </section>

        <section className="panel cases-panel">
          <div className="cases-toolbar-head">
            <div>
              <div className="section-kicker">Overzicht</div>
              <h2 className="panel-title">Alle actieve dossiers</h2>
            </div>
            {(q || review) && (
              <Link className="btn ghost" href="/cases">
                Filters wissen
              </Link>
            )}
          </div>

          <form method="get" className="cases-filters" role="search">
            <label className="cases-search-field">
              <span className="field-label">Zoeken</span>
              <input
                className="input"
                name="q"
                defaultValue={q}
                placeholder="Dossier, cliënt of klantnummer"
                aria-label="Zoek dossiers"
              />
            </label>
            <label className="cases-review-field">
              <span className="field-label">Reviewstatus</span>
              <select className="input" name="review" defaultValue={review}>
                <option value="">Alle statussen</option>
                {allowedReviews.map((value) => (
                  <option key={value} value={value}>
                    {reviewLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn" type="submit">
              Filteren
            </button>
          </form>

          {cases.length === 0 ? (
            <div className="empty-state cases-empty" role="status">
              <div className="cases-empty-mark" aria-hidden="true">⌕</div>
              <h3>{q || review ? "Geen dossiers gevonden" : "Nog geen dossiers"}</h3>
              <p>
                {q || review
                  ? "Pas je zoekterm of reviewfilter aan om andere dossiers te bekijken."
                  : "Start een nieuwe berekening om je eerste dossier aan te maken."}
              </p>
              <div className="cases-empty-actions">
                {(q || review) && (
                  <Link className="btn secondary" href="/cases">
                    Filters wissen
                  </Link>
                )}
                <Link className="btn" href="/cases/new">
                  Nieuwe berekening
                </Link>
              </div>
            </div>
          ) : (
            <div className="table-wrap cases-table-wrap">
              <table className="table cases-table">
                <caption className="sr-only">
                  Dossiers met berekeningsresultaat, werkprioriteit, documentstatus, reviewstatus en engineversie.
                </caption>
                <thead>
                  <tr>
                    <th>Dossier</th>
                    <th>Cliënt</th>
                    <th>Berekening</th>
                    <th>Prioriteit</th>
                    <th>Documenten</th>
                    <th>Review</th>
                    <th>Norm / engine</th>
                    <th>Bijgewerkt</th>
                    <th><span className="sr-only">Openen</span></th>
                    <th><span className="sr-only">Acties</span></th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => {
                    const r: any = c.result || {};
                    const calc = c.calculations[0];
                    const facts = c.documents.flatMap((d) => d.incomeFacts);
                    const proposed = facts.filter((f) => f.status === "PROPOSED").length;
                    const documentsAwaitingReview = c.documents
                      .filter((d) => d.aiStatus === "COMPLETED" || d.aiStatus === "ANALYZED")
                      .filter((d) => d.incomeFacts.some((f) => f.status === "PROPOSED")).length;
                    const documentAnalysisErrors = c.documents.filter((d) => d.aiStatus === "FAILED").length;
                    const overdueTasks = c.tasks.filter((t) => t.dueAt && new Date(t.dueAt) < now).length;
                    const todayTasks = c.tasks.filter(
                      (t) => t.dueAt && new Date(t.dueAt) >= todayStart && new Date(t.dueAt) <= todayEnd,
                    ).length;
                    const stale = !!calc && JSON.stringify(c.data) !== JSON.stringify(calc.inputSnapshot);
                    const largeChange =
                      !!calc && !!c.calculations[1] && hasLargeCalculationChange(calc.result, c.calculations[1].result);
                    const score = calculateWorkScore({
                      reviewStatus: c.reviewStatus,
                      calculationCount: c.calculations.length,
                      proposedIncomeFacts: proposed,
                      documentsAwaitingReview,
                      documentAnalysisErrors,
                      calculationStale: stale,
                      largeCalculationChange: largeChange,
                      overdueTasks,
                      todayTasks,
                    });

                    return (
                      <tr key={c.id}>
                        <td data-label="Dossier">
                          <Link className="table-link cases-title-link" href={`/cases/${c.id}`}>
                            {c.name}
                          </Link>
                        </td>
                        <td data-label="Cliënt">{c.client?.name || "—"}</td>
                        <td data-label="Berekening">
                          <strong className="cases-money">{money(r.totalNeed)}</strong>
                        </td>
                        <td data-label="Prioriteit">
                          <Link className="cases-priority" href={`/cases/${c.id}/intelligence`}>
                            <span className={`status ${workClass(score.score)}`}>{score.score}/100</span>
                            <span className="table-note">
                              {score.priority === "URGENT"
                                ? "Urgent"
                                : score.priority === "HIGH"
                                  ? "Hoog"
                                  : score.priority === "NORMAL"
                                    ? "Normaal"
                                    : "Laag"}
                            </span>
                          </Link>
                        </td>
                        <td data-label="Documenten">
                          <Link href={`/cases/${c.id}/documenten`} className="table-link">
                            {c.documents.length}
                          </Link>
                          {proposed > 0 && (
                            <div className="table-note">
                              {proposed} AI-voorstel{proposed === 1 ? "" : "len"}
                            </div>
                          )}
                        </td>
                        <td data-label="Review">
                          <Link href={`/cases/${c.id}/review`}>
                            <span className={`status ${reviewClass(c.reviewStatus)}`}>
                              {reviewLabel(c.reviewStatus)}
                            </span>
                          </Link>
                        </td>
                        <td data-label="Norm / engine">
                          <span className="cases-version">
                            {calc ? `${calc.normVersion} · ${calc.engineVersion}` : c.calculationVersion}
                          </span>
                        </td>
                        <td data-label="Bijgewerkt">
                          <span className="cases-date">{date(c.updatedAt)}</span>
                        </td>
                        <td className="cases-open-cell">
                          <Link className="btn secondary cases-open-btn" href={`/cases/${c.id}/workspace`}>
                            Open
                          </Link>
                        </td>
                        <td className="cases-actions-cell">
                          <CaseActions caseId={c.id} locked={c.reviewStatus === "FINAL" || c.reviewStatus === "APPROVED"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
