export default function CaseLoading() {
  return (
    <div className="case-detail-loading" aria-busy="true" aria-label="Dossier laden">
      <div className="case-detail-loading-bar" aria-hidden="true" />
      <div className="case-detail-loading-block" aria-hidden="true" />
      <div className="case-detail-loading-block tall" aria-hidden="true" />
    </div>
  );
}
