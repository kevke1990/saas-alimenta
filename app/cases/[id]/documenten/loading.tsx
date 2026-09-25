export default function DocumentsLoading() {
  return (
    <div className="documents-page" aria-busy="true" aria-label="Documenten laden">
      <div className="documents-loading-head"><span className="documents-skeleton documents-skeleton-kicker"/><span className="documents-skeleton documents-skeleton-title"/><span className="documents-skeleton documents-skeleton-copy"/></div>
      <div className="documents-skeleton documents-skeleton-summary"/>
      <section className="panel documents-loading-panel"><span className="documents-skeleton documents-skeleton-block"/><span className="documents-skeleton documents-skeleton-block"/><span className="documents-skeleton documents-skeleton-block"/></section>
      <span className="sr-only" role="status">Documenten worden geladen…</span>
    </div>
  );
}
