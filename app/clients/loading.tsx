import AppShell from "@/components/AppShell";

export default function ClientsLoading() {
  return (
    <AppShell>
      <main className="clients-page" aria-busy="true" aria-label="Cliënten laden">
        <div className="clients-loading-head">
          <span className="clients-skeleton clients-skeleton-kicker" />
          <span className="clients-skeleton clients-skeleton-title" />
          <span className="clients-skeleton clients-skeleton-copy" />
        </div>
        <section className="panel clients-panel clients-loading-panel">
          <span className="clients-skeleton clients-skeleton-search" />
          <div className="clients-loading-rows">{Array.from({ length: 5 }, (_, index) => <span className="clients-skeleton clients-skeleton-row" key={index} />)}</div>
        </section>
        <span className="sr-only">Cliënten worden geladen…</span>
      </main>
    </AppShell>
  );
}
