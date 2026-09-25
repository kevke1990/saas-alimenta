import AppShell from "@/components/AppShell";

export default function CasesLoading() {
  return (
    <AppShell>
      <div className="cases-page" aria-busy="true" aria-label="Dossiers laden">
        <header className="cases-header">
          <div>
            <span className="cases-skeleton cases-skeleton-kicker" />
            <span className="cases-skeleton cases-skeleton-title" />
            <span className="cases-skeleton cases-skeleton-copy" />
          </div>
        </header>
        <section className="cases-summary cases-loading-summary" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <span className="cases-skeleton cases-skeleton-summary" key={index} />)}
        </section>
        <section className="panel cases-panel">
          <div className="cases-skeleton cases-skeleton-filter" />
          <div className="cases-loading-rows" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => <span className="cases-skeleton cases-skeleton-row" key={index} />)}
          </div>
        </section>
      </div>
      <span className="sr-only" role="status">Dossiers worden geladen…</span>
    </AppShell>
  );
}
